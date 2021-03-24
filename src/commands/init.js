const { JPM_JSON } = require("../utils/jpmJson")
const fs = require("fs-extra")
const { parsePom } = require("../utils/parsePom")
const { makeArtifactPomUrl } = require("../utils/downloadMvnArtifact")
const fetch = require("node-fetch")
const { makeMvnArtifactJson } = require("../utils/makeMvnArtifactJson")
const { LIB_DIR } = require("../constants/lib")

async function init() {

    if (JPM_JSON.exists()) throw new Error("Found jpm.json already initiated in this folder.")

    fs.existsSync(LIB_DIR) && fs.removeSync(LIB_DIR)

    const mvn =
        fs.existsSync('pom.xml')
            ? (await parsePom({ filePath: 'pom.xml' }))
            : {}

    const mvnPeers =
        !Object.keys(mvn).length
            ? {}
            : await (async () => {
                let _mvnPeers = {}

                await Promise.all(
                    Object.entries(mvn).map(
                        async ([key, version]) => {
                            const [groupId, artifactId] = key.split(":")

                            const parsedPom = makeMvnArtifactJson({ groupId, artifactId, version })

                            Object.keys(parsedPom).length > 0
                                && (_mvnPeers = {
                                    ..._mvnPeers,
                                    [`${groupId}:${artifactId}`]: parsedPom
                                })
                        }
                    )
                )

                return _mvnPeers
            })()

    const npm = {}

    const jpmJson = {
        name: process.cwd().split("/").pop().split("\\").pop(),
        description: "",
        author: "",
        version: '1.0.0',
        license: "ISC",
        keywords: [],
        dependencies: { mvn, npm },
        peerDependencies: {
            mvn: mvnPeers
        },
        scripts: {
            "jolive": "npx nodemon --exec jolie ./server.ol",
            "clean": "rm ./hs_err_pid*"
        }
    }
    JPM_JSON.write(jpmJson)

}

module.exports = { init }