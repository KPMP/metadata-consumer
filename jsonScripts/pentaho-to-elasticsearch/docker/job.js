const common = require('./common.js');
const moment = require('moment');

async function getEsApiBody(db) {
  return new Promise(async function(res, rej) {
    try {
      let metadata = await common.readMetadataFile(common.DATA_DIR + process.env.METADATA_FILE);
      let predicates = metadata.map(function(meta) { return {_id: meta.packageID}; });
      let packages = await common.getPackages({ $or: predicates }, db);
      let replicates = [];
      let files = [];
      let indexDate = moment(new Date()).format("YYYY-MM-DD");

      for(let i = 0; i < packages.length; i++) {
        let package = packages[i];
        let clumps = metadata.filter((meta) => meta.packageID === package.package_id);

        for(let j = 0; j < clumps.length; j++) {
          let replicate = await common.getReplicate(package, clumps[j], db);
          replicates.push(replicate);
        }
      }

      packages = packages.flatMap((package) => [
        { index: { _index: 'metadata-packages-' + indexDate }, _type: 'package', _id: package.package_id },
        package
      ]);

      replicates = replicates.flatMap((replicate) => [
        { index: { _index: 'metadata-replicates-' + indexDate }, _type: 'replicate', _id: replicate.replicate_replicateId },
        replicate
      ]);

      res(packages.concat(replicates));
    }

    catch(err) {
      console.error('!!! Error in getEsApiBody: ', err);
      rej(err);
    }
  });
}

common.run(
  ['ES_HOST', 'ES_LOG', 'ES_VERSION', 'MONGO_URL', 'MONGO_DBNAME', 'METADATA_FILE'],
  getEsApiBody
);

