const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
require('dotenv').config();

const PROPERTY_FIXES_JSON_PATH = './property-fixes.json';
const METADATA_DIR = '/data/';

const esClient = new require('elasticsearch').Client({
  host: process.env.ES_HOST,
  log: process.env.ES_LOG,
  apiVersion: process.env.ES_VERSION
});

let propertyFixes = null;
const requiredEnvNames = ['ES_HOST', 'ES_LOG', 'ES_VERSION', 'ES_INDEX', 'MONGO_URL', 'MONGO_DBNAME', 'METADATA_FILE'];

function init(requiredEnvNames) {
  return new Promise(async function(res, rej) {
    let missingEnvNames = requiredEnvNames.filter((e) => !process.env.hasOwnProperty(e) || !process.env[e].length);
    if(missingEnvNames.length > 0) {
      console.log('!!! ERROR: Some required env vars are missing, noted with ! below:');
      for(let i = 0; i < requiredEnvNames.length; i++)  {
        console.log((missingEnvNames.indexOf(requiredEnvNames[i]) > -1 ? '! ' : '- ') + requiredEnvNames[i]);
      }
      process.exit();
    }
    
    propertyFixes = await readFile(PROPERTY_FIXES_JSON_PATH);
    propertyFixes = JSON.parse(propertyFixes);
    res();
  });
}

async function getApiCallBody(db, packageId) {
  return new Promise(async function(res, rej) {
    let packageCollection = db.collection("packages");
    let body = [];

    try {
      let metadata = await readMetadataFile();
      let packagePredicates = metadata.map(function(meta) { return {_id: meta.packageID}; });

      packageCollection.find({ $or: packagePredicates }).toArray(async function(err, docs) {
        if(err) {
          rej(err);
          return;
        }

        for(let i = 0; i < docs.length; i++) {
          let doc = docs[i];
          doc.metadata = metadata.filter((meta) => meta.packageID === doc._id);
          body = body.concat(await getFlattenedEntries(doc, db));
        }

        res(body);
      });
    }

    catch(err) {
      console.error('!!! Error in getApiCallBody: ', err);
      rej(err);
    }
  });
}

async function readMetadataFile() {
  return new Promise(async function(res, rej) {
    try {
      let metadata = await readFile(METADATA_DIR + process.env.METADATA_FILE, 'utf8');
      metadata = metadata.split(/\r?\n/)
        .filter(function (json) {
          try {
            JSON.parse(json);
            return true;
          } 
          
          catch(e) { 
            console.error('!!! Could not parse metadata row: ', json);
            return false;
          }
        })
        .map((json) => JSON.parse(json));
      res(metadata);
    }

    catch(err) {
      console.error('!!! Error in readMetadataFile: ', err);
      rej(err);
    }
  });
}

async function getFlattenedEntries(package, db) {
  return new Promise((res, rej) => {
    let output = [];
    let submitterEmail = 'none';
    let submitterDisplayName = 'none';

    db.collection('users').findOne({'_id': package.submitter.oid}, async function (err, submitter) {
      try {
        if(err) {
          rej(err);
          return;
        }
        
        if(submitter) {
          submitterEmail = submitter.email;
          submitterDisplayName = submitter.displayName;
        }

        let metaCt = package.metadata.length;

        for(let i = 0; (i == 0 && metaCt == 0) || i < metaCt; i++) {
          let doc = {};
          let indexId = package._id;

          for(prop in package) {
            let propName = fixPropertyName(prop);
            propName = propName
              .replace('metadataFile_', '')
              .replace('_id', 'packageId');
            doc['package_' + propName] = package[prop];
          }

          if(metaCt > 0) {
            indexId = package.metadata[i].replicateID;
            for(const prop in package.metadata[i]) {
              let propName = fixPropertyName(prop);
              doc[propName] = package.metadata[i][prop];
            }
          }

          doc.package_submitterEmail = submitterEmail;
          doc.package_submitterDisplayName = submitterDisplayName;

          delete doc.package_metadata;
          delete doc.package_files;
          delete doc.package_class;
          delete doc.package_submitter;

          output.push({
            index: { _index: process.env.ES_INDEX, _type: 'file-metadata', _id: indexId }
          });

          output.push(doc);
        }

        res(output);
      }

      catch(err) {
        console.error('!!! Error in getFlattenedEntries: ', err);
        rej(err);
      }
    });
  });
}

function fixPropertyName(prop) {
  try {
    let fixedProp = prop.slice(0);
    for(let replaceKey in propertyFixes.replace) {
      fixedProp = fixedProp.replace(new RegExp(replaceKey, 'g'), propertyFixes.replace[replaceKey]);
    }

    let fixedPropWords = fixedProp.split(/(?=[A-Z])/);
    for(let i = 0; i < fixedPropWords.length; i++) {
      if(i == 0 || "_" === fixedPropWords[i - 1].slice(-1)) {
        fixedPropWords[i] = fixedPropWords[i].slice(0,1).toLowerCase() + fixedPropWords[i].slice(1);
      }
    }

    if(propertyFixes.packagePropertiesOnMetadata.indexOf(prop) > -1) {
      fixedPropWords.unshift('metadataFile_');
    }

    return fixedPropWords.join('');
  }

  catch(err) {
    console.error('!!! Error during fixPropertyName: ', err);
  }
}

async function postMetadata(body) {
  return new Promise((res, rej) => {
    esClient.bulk({ body }, (err, result) => {
      if (err)  {
        rej(err);
        return;
      }

      res();
    });
  });
}

function main() {
  init(requiredEnvNames)
    .then(() => {
      MongoClient.connect(process.env.MONGO_URL, {
          'useUnifiedTopology': true,
          'forceServerObjectId' : true
        }, function(err, client) {

          if(err) {
            throw(err);
            return;
          }

          const db = client.db(process.env.MONGO_DBNAME);
          getApiCallBody(db)
            .then(postMetadata)
            .then(() => {
              client.close();
              process.exit();
          });
      });
    })
    .catch((err) => {
      console.log('!!! main failed: ', err);
    });
}

main();
