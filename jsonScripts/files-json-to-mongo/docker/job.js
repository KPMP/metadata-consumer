const common = require('./common.js');

async function loadFilesFromMetadata(db) {
  return new Promise(async function(res, rej) {
    try {
      let files = await common.readMetadataFile(process.env.METADATA_DIR + process.env.METADATA_FILE);
      let fixedFiles = files.map((file) => common.fixDates(file));
      let updateResult = await common.updatePackageFiles(process.env.PACKAGE_ID, fixedFiles, db);
      res(updateResult);
    }

    catch(err) {
      console.error('!!! Error in getEsApiBody: ', err);
      rej(err);
    }
  });
}

common.run(
  ['MONGO_URL', 'MONGO_DBNAME', 'PACKAGE_ID', 'METADATA_FILE', 'METADATA_DIR'],
    loadFilesFromMetadata
);

