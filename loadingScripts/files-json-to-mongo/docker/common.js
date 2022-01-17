require('dotenv').config();
const moment = require('moment');

const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const DATA_DIR = '/data/';


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

function fixDates(file) {
  let newFile = {};
  for(propName in file) {
    let fixedValue = fixIfDate(propName, file[propName]);
    newFile[propName] = fixedValue;
  }
  return newFile;
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
    if(date.isValid()) {
      return prop.split(' ')[0];
    }
  }

  return prop;
}

async function updatePackageFiles(packageId, files, db) {
  return db.collection('packages').updateOne({'_id': packageId}, { $set: {'files': files }});
}

function run(requiredEnvNames, loadFilesFromMetadata) {
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
          loadFilesFromMetadata(db).then((res) => {
              console.log("Success! " + res.matchedCount + " record matched. " + res.modifiedCount + " records modified.");
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
  constants,
  init,
  fixDates,
  readMetadataFile,
  updatePackageFiles,
  run
};
