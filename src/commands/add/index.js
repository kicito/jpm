const fetch = require("node-fetch");
const fs = require("fs-extra")
const semver = require("semver");

const { JPM_JSON } = require("../../utils/jpmJson")
const LIB_DIR = require("../../constants/lib");
const LATEST_VERSION = require("../../constants/latestVersion");
const PACKAGE_DIR = require("../../constants/packageDir")
const REPOSITORIES = require("../../constants/repositories")

const { updateDependencies, updateMvnPeers } = require("./updateJpmJson")
const { downloadMvnArtifact } = require("./downloadMvnArtifact");
const { downloadArtifact } = require("./downloadArtifact");

const { makeMvnArtifactJson } = require("../../utils/makeMvnArtifactJson")

const { getLatestArtifactVersion } = require("../../utils/getLatestArtifactVersion")

const tar = require("tar");

async function add(artifactRef, config = {}) {

    const { isPeer = false, installPeers = true, updateJpmJson = true } = config
    // console.log(config)

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

        !isPeer && updateJpmJson && updateDependencies(repo, installedArtifact)

        console.log(`Installed${isPeer ? ' peer dependency' : ''}: ${installedArtifact}`)

        if (installPeers) {
            if (repo === "mvn") await updateMvnPeers(installedArtifact, artifactJson)

            await addArtifactDependencies({ repo, artifactJson })
        }

        console.log('Done!')

    } catch (error) {
        console.error(error.message)
    }
}

module.exports = { add }

async function addArtifactDependencies({ repo, artifactJson }) {

    const { install } = require("../install")

    if (repo === "mvn") {
        for (let [artifactId, version] of Object.entries(artifactJson)) {
            const config = {
                isPeer: true,
                installPeers: true,
                updateJpmJson: false
            }
            await add(`${artifactId}${version !== LATEST_VERSION ? `:${version}` : ''}@${repo}`, config)
        }
    } else install(artifactJson)
}

async function addMvnArtifact(artifact) {
    const [groupId, artifactId, _version] = artifact.split(":")

    const version = _version || await getLatestArtifactVersion({ groupId, artifactId }) //throw new Error("Please specify a version when downloading from Maven.")

    await downloadMvnArtifact({ groupId, artifactId, version })

    const artifactJson = await makeMvnArtifactJson({ groupId, artifactId, version })

    return { installedArtifact: `${groupId}:${artifactId}:${version}`, artifactJson }
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
    const artifactDir = `${PACKAGE_DIR}/${artifactName}`

    fs.existsSync(artifactDir) && fs.removeSync(artifactDir, { recursive: true })

    fs.mkdirSync(artifactDir, { recursive: true })
    const stream = fs.createReadStream(archivePath).pipe(
        tar.x({ strip: 1, C: artifactDir, sync: true })
    )

    await new Promise((resolve) => stream.on('end', () => resolve()))

    fs.removeSync(archivePath)

    updateDependencies('npm', `${artifactName}:${version}`)

    const artifactJson = fs.existsSync(`${artifactDir}/jpm.json`) && fs.readJsonSync(`${artifactDir}/jpm.json`)

    // Move distJar to lib...
    if (artifactJson.distJar) {
        !fs.existsSync(LIB_DIR) && fs.mkdirSync(LIB_DIR)
        const distJarPath = `${LIB_DIR}/${artifactJson.distJar}`

        fs.existsSync(distJarPath) && fs.removeSync(distJarPath)

        const dist = `${artifactDir}/dist`

        if (fs.existsSync(dist)) {
            fs.moveSync(`${artifactDir}/dist/${artifactJson.distJar}`, distJarPath)
            fs.removeSync(`${artifactDir}/dist`)
        }

        fs.removeSync(`${artifactDir}/package.json`)
    }

    return { installedArtifact: `${artifactName}:${version}`, artifactJson }
}



