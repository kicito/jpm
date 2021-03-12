const { JPM_CACHE } = require("../utils/jpmCache");

function logout() {
    if (!JPM_CACHE.exists()) throw new Error("Not logged in.");
    const jpmCache = JPM_CACHE.read()

    if (!jpmCache.jwt) throw new Error("Not logged in.");
    JPM_CACHE.write({ ...jpmCache, jwt: undefined })

    console.log("👋 Logged out. Thanks for using Jolie Package Manager.")
}

module.exports = { logout }