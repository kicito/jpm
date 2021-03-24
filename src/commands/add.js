const fetch = require("node-fetch");
const fs = require("fs-extra")

const { JPM_JSON } = require("../utils/jpmJson")
const PACKAGE_DIR = require("../constants/packageDir")
const REPOSITORIES = require("../constants/repositories")
const LATEST_VERSION = require("../constants/latestVersion");

const { updateDependencies, updatePeers } = require("../utils/updateJpmJson")
const { downloadMvnArtifact } = require("../utils/downloadMvnArtifact");
const { downloadArtifact } = require("../utils/downloadArtifact");
const semver = require("semver");

const { makeMvnArtifactJson } = require("../utils/makeMvnArtifactJson")

const tar = require("tar");

async function add(artifactRef, parentArtifact) {

    try {
        if (!JPM_JSON.exists()) throw new Error("No jpm.json found in this folder.")

        const [repo, artifact] =
            artifactRef.slice(-4, -3) === '@'
                ? [artifactRef.slice(-3), artifactRef.slice(0, -4)]
                : ['npm', artifactRef]

        if (!REPOSITORIES.map(r => `@${r}`).includes(`@${repo}`)) {
            throw new Error("Unsupported package repository: " + repo)
        }

        const { installedArtifact, artifactJson } = await (() => {
            switch (repo) {
                case 'mvn': return addMvnArtifact(artifact)
                case 'npm': return addNpmArtifact(artifact)
            }
        })()

        !parentArtifact && updateDependencies(repo, installedArtifact)
        await updatePeers(repo, parentArtifact, installedArtifact)

        console.log(`Installed ${parentArtifact ? 'peer dependency' : ''}: ${installedArtifact}`)

        await addArtifactDependencies({ repo, artifactJson })

        console.log('Done!')

    } catch (error) {
        console.error(error.message)
    }
}


async function addArtifactDependencies({ repo, artifactJson }) {

    Object.entries(artifactJson).forEach(([artifactId, version]) => {
        add(`${artifactId}${version !== LATEST_VERSION ? `:${version}` : ''}@${repo}`, { artifactId, artifactJson })
    })

}


async function addMvnArtifact(artifact) {
    const [groupId, artifactId, _version] = artifact.split(":")

    const version = _version || await getLatestArtifactVersion({ groupId, artifactId }) //throw new Error("Please specify a version when downloading from Maven.")

    await downloadMvnArtifact({ groupId, artifactId, version })

    const artifactJson = await makeMvnArtifactJson({ groupId, artifactId, version })

    return { installedArtifact: `${groupId}:${artifactId}:${version}`, artifactJson }
}

async function getLatestArtifactVersion({ groupId, artifactId }) {
    const response = await fetch(`http://search.maven.org/solrsearch/select?q=g:%22${groupId}%22+AND+a:%22${artifactId}%22`)

    if (!response.ok) throw new Error("Error connecting to Maven.")

    const { response: { docs } } = await response.json()

    if (docs.length === 0) throw new Error("Artifact not found @ Maven.")
    return docs[0].latestVersion
}

async function addNpmArtifact(artifact) {
    const [artifactName, _version] = artifact.split(":")

    const response = await fetch(`https://registry.npmjs.org/${artifactName}`)

    if (response.status === 404)
        throw new Error(`Package ${artifactName} not found @ npm.`)
    else if (!response.ok)
        throw new Error("Error connecting to npm.")

    const body = await response.json()

    // Use latest when not specified
    const version = _version || Object.keys(body.versions).sort((a, b) => semver.gt(a, b) ? -1 : 1)[0]

    if (!body.versions[version]) throw new Error("Specified version not found.")

    const { tarball } = body.versions[version].dist

    const archivePath = await downloadArtifact({ artifactName, artifactUrl: tarball })
    const archiveDir = `${PACKAGE_DIR}/${artifactName}`

    fs.mkdirSync(archiveDir, { recursive: true })
    const stream = fs.createReadStream(archivePath).pipe(tar.x({ strip: 1, C: archiveDir, sync: true }))

    await new Promise((resolve) => stream.on('end', () => resolve()))

    fs.removeSync(archivePath)

    updateJpmJson('npm', artifactName, version)

    const artifactJson = fs.existsSync(`${archiveDir}/jpm.json`) && fs.readJsonSync(`${archiveDir}/jpm.json`)

    return { installedArtifact: `${artifactName}:${version}`, artifactJson }
}



module.exports = { add }