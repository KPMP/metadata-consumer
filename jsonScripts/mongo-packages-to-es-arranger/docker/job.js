const common = require('./common.js');
const moment = require('moment');

const PACKAGE_ID = process.env.PACKAGE_ID;

async function getEsApiBody(db) {
  return new Promise(async function(res, rej) {
    try {
      let predicate = { promoted: true };
      let packages = await common.getPackages(predicate, db);
      let indexDate = moment(new Date()).format("YYYY-MM-DD");

      let packagesForES = [];
      packages.forEach((package) => {
        packagesForES.push(common.extractProperties(package));
      });
      packagesForES = common.convertFileToExpressionMatrix(packagesForES);
      packagesForES = packagesForES.flatMap((package) => [
        { update: { _index: 'file', _id: package.file_id }},
        { doc: package, doc_as_upsert: true }
      ]);

      res(packagesForES);
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

