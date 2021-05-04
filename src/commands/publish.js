const { JPM_JSON } = require("../utils/jpmJson");
const fs = require("fs-extra")
const os = require("os");
const { execSync } = require("child_process");

function publish() {
    const packageJson = JPM_JSON.read()

    delete packageJson.dependencies
    delete packageJson.mvnPeers
    delete packageJson.distJar
    delete packageJson.scripts

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, "   ") + os.EOL)

    execSync("npm publish --access public", { stdio: [0, 1, 2] })

    fs.removeSync("package.json")
    fs.existsSync("package-lock.json") && fs.removeSync("package-lock.json")

}


module.exports = { publish }