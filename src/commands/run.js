const { JPM_JSON } = require("../utils/jpmJson")
const { execSync } = require("child_process");


function run(script) {
    if (!script) throw new Error("No script specified")

    const command = JPM_JSON.read().scripts[script]

    if (!command) throw new Error(`Invalid script: ${script}`)

    execSync(command, { stdio: [0, 1, 2] })
}

module.exports = { run }