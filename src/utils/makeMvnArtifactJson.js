const fs = require("fs-extra");
const { parsePom } = require("./parsePom")
const fetch = require("node-fetch")
const { parseMvnVersion } = require("./parseMvnVersion");
const { groupPath } = require("./artifactGroupPath");

const pomName =
    ({ artifactId, version }) =>
        `${artifactId}-${version}.pom`

const makeArtifactPomUrl =
    (artifact) =>
        `https://repo1.maven.org/maven2/${groupPath(artifact)}/${pomName(artifact)}`;

async function makeMvnArtifactJson({ groupId, artifactId, version }) {
    const response = await fetch(makeArtifactPomUrl({ groupId, artifactId, version }))
    const pomPath = `tmp-${groupId}:${artifactId}-pom.xml`

    await fs.writeFile(pomPath, await response.text())

    const { dependencies: parsedPom } = await parsePom({ filePath: pomPath })

    Object.keys(parsedPom).forEach(
        key => (parsedPom[key] = parseMvnVersion(parsedPom[key]))
    )

    fs.remove(pomPath)

    return parsedPom

}

module.exports = { makeMvnArtifactJson }