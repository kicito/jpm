const fs = require("fs-extra");
const os = require("os");

const jpmJsonPath = './jpm.json'

const JPM_JSON = {
    exists: () => fs.existsSync(jpmJsonPath),
    read: function () {
        if (!this.exists()) throw new Error("No jpm.json found in this folder.")
        return fs.readJsonSync(jpmJsonPath)
    },
    write: (jpmJson) => fs.writeFileSync(jpmJsonPath, JSON.stringify(jpmJson, null, "   ") + os.EOL)
}

module.exports = { JPM_JSON }
