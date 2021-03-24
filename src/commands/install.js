const LATEST_VERSION = require("../constants/latestVersion")
const REPOSITORIES = require("../constants/repositories")
const { JPM_JSON } = require("../utils/jpmJson")
const { add } = require("./add")

async function install() {
    const jpmJson = JPM_JSON.read()

    for (let repo of REPOSITORIES) {
        const allPeers =
            repo !== 'mvn'
                ? {}
                : Object.values(jpmJson.peerDependencies[repo])
                    .reduce((a, c) => ({ ...a, ...c }), {})

        const installEntries = [
            [
                [...Object.entries({ ...jpmJson.dependencies[repo] })],
                { installPeers: false }
            ],
            [
                [...Object.entries(allPeers)],
                { installPeers: false, isPeer: true }
            ]
        ]

        for (let [entries, config] of installEntries)
            for (let [artifact, version] of entries)
                await add(
                    `${artifact}${version !== LATEST_VERSION ? `:${version}` : ''}@${repo}`,
                    config
                )

    }
}

module.exports = { install }