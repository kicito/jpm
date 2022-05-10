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
    const url = makeArtifactPomUrl({ groupId, artifactId, version })

    const response = await fetch(url)
    const pomContent = await response.text();
    try {
        !fs.existsSync(".tmp") && fs.mkdirSync(".tmp")

        const pomPath = `.tmp/tmp-${groupId}:${artifactId}-pom.xml`
    
        await fs.writeFile(pomPath, pomContent)
    
        const { dependencies: parsedPom } = await parsePom({ filePath: pomPath })
    
        Object.keys(parsedPom).forEach(
            key => (parsedPom[key] = parseMvnVersion(parsedPom[key]))
        )
    
        fs.removeSync(".tmp")
    } catch (e) {
        console.error("error occur on makeMvnArtifactJson, skip writing file. error:", e)
        
        const { dependencies: parsedPom } = await parsePom({xmlContent: pomContent})
    
        Object.keys(parsedPom).forEach(
            key => (parsedPom[key] = parseMvnVersion(parsedPom[key]))
        )
    }

    return parsedPom

}

module.exports = { makeMvnArtifactJson }