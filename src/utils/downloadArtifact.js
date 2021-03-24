const path = require("path");
const fetch = require("node-fetch")
const fs = require("fs-extra")

const PACKAGE_DIR = require('../constants/packageDir')

async function downloadArtifact({ artifactName, artifactUrl }) {

    console.log({ artifactName, artifactUrl })

    const res = await fetch(artifactUrl);

    return new Promise((resolve, reject) => {
        !fs.existsSync(PACKAGE_DIR) && fs.mkdirSync(PACKAGE_DIR)

        const filePath = path.join(PACKAGE_DIR, `${artifactName}.tgz`)
        const fileStream = fs.createWriteStream(filePath)

        res.body.pipe(fileStream);

        res.body.on("error", err => reject(err));
        fileStream.on("finish", () => resolve(filePath));
    });
}

module.exports = { downloadArtifact }