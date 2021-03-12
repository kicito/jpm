const fetch = require("node-fetch");
const extract = require('extract-zip')
const path = require("path")
const fs = require("fs-extra")

const { JPM_JSON } = require("../utils/jpmJson")
const { JPM_ENDPOINT } = require("../constants/jpmEndpoint")
const { PACKAGE_DIR } = require("../constants/packageDir")
const { REPOSITORIES } = require("../constants/repositories")

const { updateJpmJson } = require("../utils/updateJpmJson")
const { downloadArtifact } = require("../utils/downloadArtifact");
const { exec } = require("../utils/exec");

const postinstall = () => {
    exec("jpmc run postinstall")
}


async function add({ artifactName, version }) {
    try {
        if (!JPM_JSON.exists()) throw new Error("No jpm.json found in this folder.")

        const [pkgRepo, pkgName] =
            artifactName.slice(-4, -3) === '@'
                ? [artifactName.slice(-3), artifactName.slice(0, -4)]
                : ['jpm', artifactName]

        if (!REPOSITORIES.map(r => `@${r}`).includes(`@${pkgRepo}`)) {
            throw new Error("Unsupported package repository: " + pkgRepo)
        }

        console.log(pkgRepo)

        const fileUrl = `${JPM_ENDPOINT}/pkgs/${pkgName}/${version ? version : ''}`
        console.log(fileUrl)
        const response = await fetch(fileUrl)
        const package = await response.json()

        if (response.ok) {
            !fs.existsSync(PACKAGE_DIR) && fs.mkdirSync(PACKAGE_DIR)

            const archivePath = await downloadArtifact(pkgName, package.version.file.secure_url)

            console.log(archivePath)
            await extract(archivePath, { dir: path.resolve(PACKAGE_DIR) })
            await fs.removeSync(archivePath)
            console.log('Installation complete.')

            updateJpmJson({ pkgRepo, pkgName, version: package.version.semantic })
        } else {
            if (response.status === 404)
                throw new Error(`Package ${pkgName} not found @ ${pkgRepo}`)
            else
                throw new Error("Error connecting to Jolie Package Manager.")
        }

        JPM_JSON.read().scripts.postinstall && postinstall()


    } catch (error) {
        console.error(error.message)
    }
}

module.exports = { add }