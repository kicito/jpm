const LATEST_VERSION = require('../constants/latestVersion')

function parseMvnVersion(rangeString) {

    let ranges = rangeString.split(",").filter(v => Boolean(v))
    let version = ranges.pop()

    if (version === ")") return LATEST_VERSION

    version.includes(")") && (version = ranges.pop())

    if (version.includes("(")) {
        // e.g "(1.4" <---- from (1.4, 4.0) 
        let versionToMap = version.replace("(", "").split(".")
        versionToMap[versionToMap.length - 1]++

        version = versionToMap.join(".")
    }

    if (version.includes("[") || version.includes("]")) {
        version = version.replace("[", "").replace("]", "")
    }

    return version

}

module.exports = { parseMvnVersion }