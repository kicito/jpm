const { JPM_JSON } = require("../../utils/jpmJson")
const { makeMvnArtifactJson } = require("../../utils/makeMvnArtifactJson")

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

async function updateMvnPeers(installedArtifact, parsedPom) {

    const jpmJson = JPM_JSON.read()

    if (!jpmJson.mvnPeers) jpmJson.mvnPeers = {}
    const [groupId, artifactId] = installedArtifact.split(":")

    console.log({ parsedPom })

    Object.keys(parsedPom).length > 0 && (
        jpmJson.mvnPeers[`${groupId}:${artifactId}`] = parsedPom
    )

    JPM_JSON.write(jpmJson)
}

module.exports = { updateDependencies, updateMvnPeers }