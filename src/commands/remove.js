const PACKAGE_DIR = require('../constants/packageDir');
const { JPM_JSON } = require('../utils/jpmJson');
const fs = require("fs-extra")

function remove(artifact) {

    const [artifactName] = artifact.split("^")

    fs.removeSync(`${PACKAGE_DIR}/${artifactName}`, { recursive: true });

    const jpmJson = JPM_JSON.read()

    delete jpmJson.dependencies.jpm[artifactName]

    JPM_JSON.write(jpmJson)
}

module.exports = { remove }