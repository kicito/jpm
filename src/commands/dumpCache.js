const { JPM_CACHE } = require("../utils/jpmCache");

function dumpCache() {
    JPM_CACHE.dump()
    console.log("Done! Cache dumped.")
}

module.exports = { dumpCache }