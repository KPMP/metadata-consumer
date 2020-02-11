require('./common.js');

async function getEsApiBody(db) {
  return new Promise(async function(res, rej) {
    try {
      let metadata = await readMetadataFile(DATA_DIR + process.env.METADATA_FILE);
      let predicates = metadata.map(function(meta) { return {_id: meta.packageID}; });
      let packages = await getPackages(predicates, db);
      let replicates = [];
      let files = [];
      let indexDate = moment(new Date()).format("YYYY-MM-DD");

      packages.forEach((package) => {
        let pkgMeta = metadata.filter((meta) => meta.packageID === package._id);
        replicates = pkgMeta.map(async function(meta) {
          return await getReplicate(package, meta, db);
        });

        // replicates.forEach((replicate) => {
        //   let fileNames = Object.getOwnPropertyNames(replicate).match(/FileName$/i);
        //   fileNames.forEach((fileName) => {
        //     // TODO filter the package files for matching name and kick a row into files
        //   });
        // });
      });

      // Flatmap the output body with these indexing commands
      // output.push({
      //   index: { _index: process.env.ES_INDEX, _type: 'file-metadata', _id: indexId }
      // });
      
      packages = packages.flatMap((package) => [
        { index: { _index: 'metadata-packages-' + indexDate }, _type: 'package', _id: package.package_id },
        package
      ]);

      replicates = replicates.flatMap((replicate) => [
        { index: { _index: 'metadata-replicates-' + indexDate }, _type: 'replicate', _id: replicate.replicate_replicate_id },
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

console.log('!!! Got this far!');
console.log('... PACKAGE_TYPE: ' + PACKAGE_PROPS);

run(['ES_HOST', 'ES_LOG', 'ES_VERSION', 'MONGO_URL', 'MONGO_DBNAME', 'METADATA_FILE']);
