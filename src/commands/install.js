const LATEST_VERSION = require("../constants/latestVersion")
const REPOSITORIES = require("../constants/repositories")
const { JPM_JSON } = require("../utils/jpmJson")
const { add } = require("./add")

async function install() {
    const jpmJson = JPM_JSON.read()

    for (let repo of REPOSITORIES) {
        const depEntries = Object.entries(jpmJson.dependencies[repo])

        for (let [artifactId, version] of depEntries) {
            const adding = `${artifactId}${version !== LATEST_VERSION ? `:${version}` : ''}@${repo}`

            console.log({ adding })
            await add(adding)
        }
    }

}

module.exports = { install }