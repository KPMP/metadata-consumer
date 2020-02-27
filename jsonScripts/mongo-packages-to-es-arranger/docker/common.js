require('dotenv').config();
const moment = require('moment');

const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

const CONSTANTS_PATH = './constants.json';
const DATA_DIR = '/data/';

const CREATE_INDEX = (process.env.CREATE_INDEX == "Y");

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

async function getPackages(predicate, db) {
  return new Promise((res, rej) => {
    db.collection("packages").find(predicate).toArray(async function(err, docs) {
      let output = [];
      try {
        if(err) {
          rej(err);
          return;
        }

        for(let i = 0; i < docs.length; i++) {
            let doc = docs[i];
          let packageInfo = await getPackageInfo(doc, db);
          output.push(Object.assign(doc, packageInfo));
        }

        res(output);
      }

      catch(err) {
        rej(err);
      }
    });
  });
}

async function getPackageInfo(package, db) {
    return new Promise((res, rej) => {
        db.collection('packagePortalData').findOne({'packageId': package._id}, async function (err, packageInfo) {
            try {
                if(err) {
                    rej(err);
                    return;
                }
               res(packageInfo);
            }
            catch(err) {
                rej(err);
            }
        });
    });
}

function extractProperties(document) {
      let doc = {};
      for(let docPropName in constants.includeProps) {
        let value = document[docPropName]?document[docPropName]:constants.includeProps[docPropName]["default"];
        let fixedValue = fixIfDate(docPropName, value);
        let propName = constants.includeProps[docPropName]["propertyName"];
        doc[propName] = fixedValue;
      }
      return doc;
}

function convertFileToExpressionMatrix(documents) {
      return documents.map((document) => {
        return {...document, file_name: document.file_id + "_" + "expression_matrix.zip"};
      });
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

async function createEsIndex(indexName, body) {
  return new Promise((res, rej) => {
    esClient.indices.create({ index: indexName, body: body }, (err, result) => {
      if (err)  {
        rej(err);
        return;
      }
      res();
    });
  });
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
              .then(CREATE_INDEX && createEsIndex("file", constants.arrangerIndexMapping))
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
  getPackages,
  postToEsApi,
  extractProperties,
  convertFileToExpressionMatrix,
  run
};
