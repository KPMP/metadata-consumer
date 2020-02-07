const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);

//Ensure we have all required arguments
let requiredEnvNames = ['ES_HOST', 'ES_LOG', 'ES_VERSION', 'ES_INDEX', 'MONGO_URL', 'MONGO_DBNAME', 'METADATA_JSON_PATH'];
let missingEnvNames = requiredEnvNames.filter((e) => !process.env.hasOwnProperty(e) || !process.env[e].length);

if(missingEnvNames.length > 0) {
  console.log('!!! ERROR: Some required env vars are missing, noted with ! below:');
  for(let i = 0; i < requiredEnvNames.length; i++)  {
    console.log((missingEnvNames.indexOf(requiredEnvNames[i]) > -1 ? '! ' : '- ') + requiredEnvNames[i]);
  }
  process.exit();
}

let propertyFixes = null;
const PROPERTY_FIXES_JSON_PATH = './property-fixes.json';

//Create an elasticsearch client
const esClient = new require('elasticsearch').Client({
  host: process.env.ES_HOST,
  log: process.env.ES_LOG,
  apiVersion: process.env.ES_VERSION
});

async function getApiCallBody(db, packageId) {
  return new Promise((res, rej) => {
    var packageCollection = db.collection("packages");
    var body = [];

    packageCollection.findOne({ _id: packageId }, async function(err, doc) {
      assert.equal(null, err);

      try {
        doc.metadata = await getMetadataJson(process.env.METADATA_JSON_PATH, packageId);
        res(await getFlattenedEntries(doc, db));
      }

      catch(err) {
        console.error('!!! Error in getApiCallBody: ', err);
        rej(err);
      }
    });
  });
}

async function getMetadataJson(path, packageId) {
  //Use the file system to read the newline-delimited JSON metadata records to an array
  return new Promise(async function(res, rej) {
    try {
      let metadataRows = await readFile(path).split(/[\r\n]+/);
      console.log('+++ getMetadataJson -> ', metadataRows);
      let output = [];
      for(metadata in metadataRows) {
        if(packageId.equals(metadata.packageID)) {
          output.push(metadata);
        }
      }

      res(output);
    }

    catch(err) {
      console.error('!!! Error in getMetadataJson: ', err);
      rej(err);
    }
  });
}

async function fixPropertyName(prop) {
  return new Promise(async function(res, rej) {
    try {
      if(propertyFixes == null) {
        propertyFixes = await readFile(PROPERTY_FIXES_JSON_PATH);
      }

      let fixedProp = prop.slice(0);

      for(let replaceKey in propertyFixes.replace) {
        fixedProp = fixedProp.replace(new RegExp(replaceKey, 'g'), propertyFixes.replace[replaceKey]);
      }

      let fixedPropWords = fixedProp.split(/(?=[A-Z])/);
      for(let i = 0; i < fixedPropWords.length; i++) {
        if(i == 0 || "_" === fixedPropWords[i - 1].slice(-1)) {
          fixedPropWords[i] = fixedPropWords[i].slice(0).toLowerCase() + fixedPropWords[i].slice(1);
        }
      }

      if(propertyFixes.packagePropertiesOnMetadata.indexOf(prop)) {
        fixedPropWords.unshift('metadataFile_');
      }

      res(fixedPropWords.join(''));
    }

    catch(err) {
      console.error('!!! Error during fixPropertyName: ', err);
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
      if(null !== err) {
        console.error('!!! Error in getFlattenedEntries, findOne for submitter: ', err);
        rej(err);
      }

      else if(submitter) {
        submitterEmail = submitter.email;
        submitterDisplayName = submitter.displayName;
      }

      let metaCt = package.metadata.length;

      for(let i = 0; (i == 0 && metaCt == 0) || i < metaCt; i++) {
        let doc = {};

        for(prop in package) {
          let propName = await fixPropertyName(prop);
          doc['Package_' + propName] = package[prop];
        }

        if(metaCt > 0) {
          for(const prop in package.metadata[i]) {
            let propName = await fixPropertyName(prop);
            doc[propName] = package.metadata[i][prop];
          }
        }

        doc.Submitter_email = submitterEmail;
        doc.Submitter_displayName = submitterDisplayName;

        delete doc.Package_files;
        delete doc.Package_class;
        delete doc.Package_submitter;

        output.push({
          index: { _index: process.env.ES_INDEX, _type: 'package-metadata', _id: fileCt > 0 ? doc.fileId : doc.packageId }
        });

        output.push(doc);
      }

      res(output);
    });
  });
}

async function postMetadata(body) {
  return new Promise((res, rej) => {
    esClient.ping({
      requestTimeout: 10000
    }, (err) => {
      if(err) {
        console.error('Error, cannot connect: ' + err);
        rej(err);
      }

      else {
        esClient.bulk({ body: body }, function (err, result) {
          res();
        });
      }
    });
  });
}

MongoClient.connect(process.env.MONGO_URL, {
    'useUnifiedTopology': true,
    'forceServerObjectId' : true
  }, function(err, client) {
  assert.equal(null, err);
  console.log("successfully connected to server");
  const db = client.db(process.env.MONGO_DBNAME);
  getApiCallBody(db)
    .then(postMetadata)
    .then(() => {
      client.close();
      process.exit();
    });
});
