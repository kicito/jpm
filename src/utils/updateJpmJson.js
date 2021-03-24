const { makeArtifactPomUrl } = require("./downloadMvnArtifact")
const { JPM_JSON } = require("./jpmJson")

const fs = require("fs-extra")
const fetch = require("node-fetch")
const { parsePom } = require("./parsePom")
const { parseMvnVersion } = require("./parseMvnVersion")
const { makeMvnArtifactJson } = require("./makeMvnArtifactJson")

function updateDependencies(repo, artifact) {

    const [version, artifactName, groupId] = artifact.split(":").reverse()

    const artifactId = groupId ? `${groupId}:${artifactName}` : artifactName
    const jpmJson = JPM_JSON.read()

    jpmJson.dependencies[repo] = {
        ...jpmJson.dependencies[repo],
        [artifactId]: version
    }

    JPM_JSON.write(jpmJson)
}

async function updatePeers(repo, installedArtifact) {

    const jpmJson = JPM_JSON.read()

    if (!jpmJson.peerDependencies) jpmJson.peerDependencies = {}

    let artifactJson = {}

    switch (repo) {
        case 'mvn':
            if (!jpmJson.peerDependencies.mvn)
                jpmJson.peerDependencies.mvn = {}

            const [groupId, artifactId, version] = installedArtifact.split(":")
            const parsedPom = await makeMvnArtifactJson({ groupId, artifactId, version })

            console.log({ parsedPom })

            Object.keys(parsedPom).length > 0 && (
                jpmJson.peerDependencies.mvn[`${groupId}:${artifactId}`] = parsedPom
            )


            artifactJson = parsedPom

            break
        case 'npm':
            //TODO
            artifactJson = {}
    }

    JPM_JSON.write(jpmJson)

    return artifactJson

}

module.exports = { updateDependencies, updatePeers }