const { exec } = require("../utils/exec")
const { JPM_JSON } = require("../utils/jpmJson")

function run(script) {
    if (!script) throw new Error("No script specified")

    const command = JPM_JSON.read().scripts[script]

    if (!command) throw new Error(`Invalid script: ${script}`)

    exec(command)
}

module.exports = { run }