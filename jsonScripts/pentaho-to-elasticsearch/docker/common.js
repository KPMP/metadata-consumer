require('dotenv').config();
const moment = require('moment');

const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

const CONSTANTS_PATH = './constants.json';
const DATA_DIR = '/data/';
const PACKAGE_PROPS = 'package_';
const REPLICATE_PROPS = 'replicate_';
const FILE_PROPS = 'file_';

const esClient = new require('elasticsearch').Client({
  host: process.env.ES_HOST,
  log: process.env.ES_LOG,
  apiVersion: process.env.ES_VERSION
});

let constants = null;

async function init(requiredEnvNames) {
  return new Promise(async function(res, rej) {
    let missingEnvNames = requiredEnvNames.filter((e) => !process.env.hasOwnProperty(e) || !process.env[e].length);
    if(missingEnvNames.length > 0) {
      console.log('!!! ERROR: Some required env vars are missing, noted with ! below:');
      for(let i = 0; i < requiredEnvNames.length; i++)  {
        console.log((missingEnvNames.indexOf(requiredEnvNames[i]) > -1 ? '! ' : '- ') + requiredEnvNames[i]);
      }
      rej();
    }
    
    constants = await readFile(CONSTANTS_PATH);
    constants = JSON.parse(constants);
    res();
  });
}

async function readMetadataFile(path) {
  return new Promise(async function(res, rej) {
    try {
      let metadata = await readFile(path, 'utf8');
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

async function getPackages(predicate, db) {
  return new Promise((res, rej) => {
    let packageCollection = db.collection("packages");
    db.collection("packages").find(predicate).toArray(async function(err, docs) {
      let output = [];
      try {
        if(err) {
          rej(err);
          return;
        }

        for(let i = 0; i < docs.length; i++) {
          let doc = docs[i];
          let awaitDoc = await getPackage(doc, db);
          output.push(awaitDoc);
        }

        res(output);
      }

      catch(err) {
        rej(err);
      }
    });
  });
}

async function getPackage(package, db) {
  return new Promise((res, rej) => {
    db.collection('users').findOne({'_id': package.submitter.oid}, async function (err, submitter) {
      try {
        if(err) {
          rej(err);
          return;
        }

        let doc = {};
        let submitterEmail = 'none';
        let submitterDisplayName = 'none';
        
        if(submitter) {
          submitterEmail = submitter.email;
          submitterDisplayName = submitter.displayName;
        }

        for(prop in package) {
          let propName = fixPropertyName(prop, 'package_');
          let fixedValue = fixIfDate(prop, package[prop]);
          doc[propName] = fixedValue;
        }

        doc.package_submitterEmail = submitterEmail;
        doc.package_submitterDisplayName = submitterDisplayName;

        delete doc.package_files;
        delete doc.package_class;
        delete doc.package_submitter;

        res(doc);
      }

      catch(err) {
        rej(err);
      }
    });
  });
}

async function flattenDocument(flatDocument, rawRecord, db, type) {
  return new Promise((res, rej) => {
    try {

      let doc = Object.assign({}, flatDocument);

      for(const prop in rawRecord) {
        let propName = fixPropertyName(prop, type);
        let fixedValue = fixIfDate(prop, rawRecord[prop]);
        doc[propName] = fixedValue;
      }

      res(doc);
    }

    catch(err) {
      rej(err);
    }
  });
}

async function getReplicate(doc, replicate, db) {
  return await flattenDocument(doc, replicate, db, REPLICATE_PROPS);
}

async function getFile(doc, file, db) {
  return await flattenDocument(doc, file, db, FILE_PROPS);
}

function fixPropertyName(prop, type) {
  try {
    let fixedProp = prop.slice(0);
    for(let replaceKey in constants.propertyFixes.replace) {
      fixedProp = fixedProp.replace(new RegExp(replaceKey, 'g'), constants.propertyFixes.replace[replaceKey]);
    }

    let fixedPropWords = fixedProp.split(/(?=[A-Z])/);
    fixedPropWords.unshift(type);
    for(let i = 0; i < fixedPropWords.length; i++) {

      if(!fixedPropWords[i])  {
        continue;
      }

      else if(i == 0 || "_" === fixedPropWords[i - 1].slice(-1)) {
        fixedPropWords[i] = fixedPropWords[i].slice(0,1).toLowerCase() + fixedPropWords[i].slice(1);
      }
    }

    return fixedPropWords.join('');
  }

  catch(err) {
    console.error('!!! Error during fixPropertyName: ', err);
  }
}

function fixIfDate(propName, prop) {
  if(!propName || !propName.match(new RegExp(".*[dD]ate$", "i"))) {
    return prop;
  }

  let formats = [
    moment.ISO_8601,
    "YYYY-MM-DD",
    "YYYY/MM/DD 00:00:00.000"
  ];

  let date = null;

  for(let i = 0; i < formats.length; i++) {
    date = moment(prop, formats[i]);
    console.log(date);
    if(date.isValid()) {
      return date.toISOString();
    }
  }

  return prop;
}

async function postToEsApi(body) {
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

function run(requiredEnvNames, getEsApiBody) {
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
          getEsApiBody(db)
            .then(postToEsApi)
            .then(() => {
              client.close();
              process.exit();
          });
      });
    })
    .catch((err) => {
      console.log('!!! run failed: ', err);
    });
}

module.exports = {
  DATA_DIR,
  esClient,
  constants,
  init,
  readMetadataFile,
  getPackages,
  getPackage,
  getReplicate,
  getFile,
  postToEsApi,
  run
};
