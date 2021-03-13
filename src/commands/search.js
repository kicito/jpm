const fetch = require("node-fetch")
const util = require('util')

const { JPM_ENDPOINT } = require("../constants/jpmEndpoint")

async function search(query) {
    const response = await fetch(`${JPM_ENDPOINT}/pkgs/search/${query}`)

    if (response.ok) {
        const { packages } = await response.json()
        console.log(response)
        console.log(util.inspect(packages, false, null, true))
    } else throw new Error("Error connecting to JPM")

}

module.exports = { search }