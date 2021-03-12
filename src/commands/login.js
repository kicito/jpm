const fs = require('fs-extra')
const os = require("os")
const fetch = require("node-fetch")

const { JPM_ENDPOINT } = require('../constants/jpmEndpoint')
const { JPM_CACHE } = require('../utils/jpmCache')

async function login({ email, password }) {

    if (!email || !password) throw new Error("Provide credentials")

    // email = 'hello@luisanton.io'
    // password = 'password'
    const response = await fetch(`${JPM_ENDPOINT}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })


    if (response.ok) {
        const jwt = await response.json()

        console.log("🚀 Logged in. Welcome to Jolie Package Manager.")
        JPM_CACHE.write({ jwt })
    } else {
        const { message } = await response.json()
        throw new Error(message)
    }
}

module.exports = { login }