const AdmZip = require('adm-zip');
const fs = require("fs-extra")
const glob = require("glob")
const fetch = require("node-fetch");
const FormData = require('form-data');

const { JPM_ENDPOINT } = require('../constants/jpmEndpoint');
const { JPM_CACHE } = require('../utils/jpmCache');
const { JPM_JSON } = require("../utils/jpmJson");

const chalk = require('chalk');

const NOT_LOGGED_IN = `Not logged in. Login first using: ${chalk.cyanBright('jpmc login <username> <password>')}`

function publish() {
    if (!JPM_JSON.exists()) throw new Error("JPM not initialized")
    const { name: pkgName } = JPM_JSON.read()

    if (!JPM_CACHE.exists()) throw new Error(NOT_LOGGED_IN)
    const { jwt } = JPM_CACHE.read()
    if (!jwt) throw new Error(NOT_LOGGED_IN)

    const { token } = jwt
    const tmp = ".__tmp"
    const zipDest = `${tmp}/${pkgName}`

    fs.existsSync(tmp) && fs.removeSync(tmp, { recursive: true })

    console.log(pkgName)

    fs.mkdirSync(tmp)
    fs.mkdirSync(zipDest)

    const zip = new AdmZip()

    glob(`!(packages|lib|${tmp})`, (err, files) => {
        for (let file of files) fs.copyFileSync(file, `${zipDest}/${file}`)
        zip.addLocalFolder(tmp)

        const zipName = `${pkgName}.zip`
        zip.writeZip(zipName)

        fs.removeSync(tmp, { recursive: true })

        uploadArtifact(zipName, token)

    })


}


async function uploadArtifact(zipName, token) {
    const { name: handle, version, tags } = JPM_JSON.read()
    const body = new FormData();
    body.append("archive", fs.createReadStream(zipName));
    body.append("packageData", JSON.stringify({ handle, version, tags }));

    const response = await fetch(`${JPM_ENDPOINT}/pkgs`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body
    })

    const result = await response.json()

    console.log(chalk.cyanBright("Response status: " + response.status))
    console.log(result)

    fs.removeSync(zipName)

}

module.exports = { publish }