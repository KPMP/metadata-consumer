const common = require('./common.js');
const moment = require('moment');

const PACKAGE_ID = process.env.PACKAGE_ID;

async function getEsApiBody(db) {
  return new Promise(async function(res, rej) {
    try {
      let predicate = PACKAGE_ID && PACKAGE_ID.length > 0 ? { _id: PACKAGE_ID } : { };
      let packages = await common.getPackages(predicate, db);
      let indexDate = moment(new Date()).format("YYYY-MM-DD");

      packages.forEach((package) => delete package.files);

      packages = packages.flatMap((package) => [
        { update: { _index: 'metadata-packages-' + indexDate, _id: package.package_id }},
        { doc: package, doc_as_upsert: true }
      ]);

      res(packages);
    }

    catch(err) {
      console.error('!!! Error in getEsApiBody: ', err);
      rej(err);
    }
  });
}

common.run(
  ['ES_HOST', 'ES_LOG', 'ES_VERSION', 'MONGO_URL', 'MONGO_DBNAME'],
  getEsApiBody
);

