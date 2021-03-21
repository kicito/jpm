const fs = require("fs-extra");
const { parsePom } = require("./parsePom")
const fetch = require("node-fetch")
const { makeArtifactPomUrl } = require("./downloadMvnArtifact");

async function makeMvnArtifactJson({ groupId, artifactId, version }) {
    const response = await fetch(makeArtifactPomUrl({ groupId, artifactId, version }))
    const pomPath = `tmp-${groupId}:${artifactId}-pom.xml`

    await fs.writeFile(pomPath, await response.text())

    const parsedPom = await parsePom({ filePath: pomPath })
    console.log({ parsedPom })

    fs.remove(pomPath)

    return parsedPom

}

module.exports = { makeMvnArtifactJson }