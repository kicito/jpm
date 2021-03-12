const { init } = require("./init");
const { remove } = require("./remove");
const { run } = require("./run");
const { add } = require("./add");
const { install } = require("./install");
const { publish } = require("./publish");
const { login } = require("./login");
const { logout } = require("./logout");
const { search } = require("./search");
const { dumpCache } = require("./dumpCache");

const Command = {
    init: "init",
    add: "add",
    install: "install",
    remove: "remove",
    run: "run",
    publish: "publish",
    login: "login",
    logout: "logout",
    search: "search",
    "dump-cache": "dump-cache"
}

async function execute(command, args) {
    // console.log({ command, args })

    const maxArgs = n => {
        if (args.length > n)
            throw new Error("Unexpected arguments: " + [...args.slice(1)])
    }

    switch (command) {
        case Command.init:
            maxArgs(0)
            init()
            break
        case Command.add:
            maxArgs(1)
            const [artifactName, version] = args[0].split('^')
            await add({ artifactName, version })
            break
        case Command.install:
            install()
            break
        case Command.remove:
            maxArgs(1)
            const [pkgName] = args[0].split('^')
            remove({ pkgName })
            break
        case Command.run:
            maxArgs(1)
            run(args[0])
            break
        case Command.publish:
            maxArgs(0)
            await publish()
            break
        case Command.login:
            maxArgs(2)
            const [email, password] = args
            await login({ email, password })
            break
        case Command.logout:
            maxArgs(0)
            logout()
            break
        case Command.search:
            maxArgs(1)
            await search(args[0])
            break
        case Command["dump-cache"]:
            maxArgs(0)
            dumpCache()
            break
        default:
            console.log("Command not found: " + command + "\nRun --help for a list of available commands")
    }
}

module.exports = { execute, Command }