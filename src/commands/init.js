const { JPM_JSON } = require("../utils/jpmJson")

function init() {
    if (JPM_JSON.exists()) throw new Error("Found jpm.json already initiated in this folder.")

    const jpmJson = {
        name: process.cwd().split("/").pop().split("\\").pop(),
        description: "",
        author: "",
        version: '1.0.0',
        tags: [],
        dependencies: {
            mvn: {},
            npm: {},
            jpm: {}
        },
        scripts: {
            "jolive": "npx nodemon --exec jolie ./server.ol",
            "clean": "rm ./hs_err_pid*",
            "postinstall": "npx jolie-postinstall"
        }
    }
    JPM_JSON.write(jpmJson)

    // exec("npm install jolie-postinstall", (err, stdout, stderr) => {
    //     console.log(stdout)
    // })
}

module.exports = { init }