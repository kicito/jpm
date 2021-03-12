const { PACKAGE_DIR } = require('../constants/packageDir');
const { JPM_JSON } = require('../utils/jpmJson');
const fs = require("fs-extra")

function remove({ pkgName }) {

    fs.removeSync(`${PACKAGE_DIR}/${pkgName}`, { recursive: true });

    const jpmJson = JPM_JSON.read()

    delete jpmJson.dependencies.jpm[pkgName]

    JPM_JSON.write(jpmJson)
}

module.exports = { remove }