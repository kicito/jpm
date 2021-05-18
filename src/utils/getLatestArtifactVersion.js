const fetch = require("node-fetch")

async function getLatestArtifactVersion({ groupId, artifactId }) {
    const endpoint = `http://search.maven.org/solrsearch/select?q=g:%22${groupId}%22+AND+a:%22${artifactId}%22`

    console.log(endpoint)
    const response = await fetch(endpoint)

    if (!response.ok) throw new Error("Error connecting to Maven.")

    const { response: { docs } } = await response.json()

    if (docs.length === 0) throw new Error("Artifact not found @ Maven.")
    return docs[0].latestVersion
}

module.exports = { getLatestArtifactVersion }