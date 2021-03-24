const { JPM_JSON } = require("../utils/jpmJson");
const fs = require("fs-extra")
const os = require("os");
const { execSync } = require("child_process");

function publish() {
    const packageJson = JPM_JSON.read()

    delete packageJson.dependencies
    delete packageJson.scripts

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, "   ") + os.EOL)
    fs.writeFileSync('.npmignore', "lib/\ntarget/\n.settings/\n.classpath\n.project\nsrc/\npom.xml\npackages/" + os.EOL)

    execSync("npm publish", { stdio: [0, 1, 2] })

    fs.removeSync("package.json")

}


module.exports = { publish }