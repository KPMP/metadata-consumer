const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

//Ensure we have all required arguments
let requiredEnvNames = ['ES_HOST', 'ES_LOG', 'ES_VERSION', 'ES_INDEX', 'MONGO_URL', 'MONGO_DBNAME'];
let missingEnvNames = requiredEnvNames.filter((e) => !process.env.hasOwnProperty(e) || !process.env[e].length);

if(missingEnvNames.length > 0) {
  console.log('!!! ERROR: Some required env vars are missing, noted with ! below:');
  for(let i = 0; i < requiredEnvNames.length; i++)  {
    console.log((missingEnvNames.indexOf(requiredEnvNames[i]) > -1 ? '! ' : '- ') + requiredEnvNames[i]);
  }
  process.exit();
}

//Create an elasticsearch client
const esClient = new require('elasticsearch').Client({
  host: process.env.ES_HOST,
  log: process.env.ES_LOG,
  apiVersion: process.env.ES_VERSION
});

const PACKAGE_ID = process.env.PACKAGE_ID;
const MONGO_PACKAGE_QUERY = PACKAGE_ID && PACKAGE_ID.length > 0 ? { _id: PACKAGE_ID } : { };

async function getApiCallBody(db) {
  return new Promise((res, rej) => {
    var packageCollection = db.collection("packages");
    var body = [];

    packageCollection.find(MONGO_PACKAGE_QUERY).toArray(async function(err, docs) {
      assert.equal(null, err);

      let packageCt = docs.length;

      for(let i = 0; i < packageCt; i++) {
        body = body.concat(await getFlattenedPackageFiles(docs[i], db));
      }

      res(body);
    });
  });
}

async function getFlattenedPackageFiles(package, db) {
  return new Promise((res, rej) => {
    let output = [];
    let submitterEmail = 'none';
    let submitterDisplayName = 'none';

    db.collection('users').findOne({'_id': package.submitter.oid}, (err, submitter) => {
      if(null !== err) {
        console.error('!!! Error in getFlattenedPackageFiles, findOne for submitter: ', err);
        rej(err);
      }

      else if(submitter) {
        submitterEmail = submitter.email;
        submitterDisplayName = submitter.displayName;
      }

      let fileCt = package.files.length;

      for(let i = 0; (i == 0 && fileCt == 0) || i < fileCt; i++) {
        let doc = Object.assign({}, package);

        doc.packageId = doc._id;

        if(fileCt > 0) {
          doc.fileId = package.files[i]._id;
          doc.fileSize = package.files[i].size;
          doc.fileName = package.files[i].fileName;
        }

        doc.submitterEmail = submitterEmail;
        doc.submitterDisplayName = submitterDisplayName;

        delete doc.files;
        delete doc._class;
        delete doc._id;
        delete doc.submitter;

        output.push({
          index: { _index: process.env.ES_INDEX, _type: 'package-metadata', _id: fileCt > 0 ? doc.fileId : doc.packageId }
        });

        output.push(doc);
      }

      res(output);
    });
  });
}

async function insertPackages(body) {
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
    .then(insertPackages)
    .then(() => {
      client.close();
      process.exit();
    });
});
