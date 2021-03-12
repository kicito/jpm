const fs = require("fs-extra");
const os = require("os");

const JPM_JSON = {
    exists: () => fs.existsSync('./jpm.json'),
    read: () => fs.readJsonSync('./jpm.json'),
    write: (jpmJson) => fs.writeFileSync('./jpm.json', JSON.stringify(jpmJson, null, "   ") + os.EOL)
}

module.exports = { JPM_JSON }
