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

const Command = { // [operation, expectedArgs]
    init: [init, [0]],
    add: [add, [1]],
    install: [install, [0]],
    remove: [remove, [1]],
    run: [run, [1]],
    publish: [publish, [0]],
    login: [login, [2]],
    logout: [logout, [0]],
    search: [search, [1]],
    "dump-cache": [dumpCache, [0]]
}

async function execute(command, args) {
    const checkArgs = expArgs => {
        if (!expArgs.includes(args.length)) {
            throw new Error("Expected number of arguments: " +
                `${expArgs[0]}${expArgs.slice(1).map(ea => `, or ${ea}`).join("")}` +
                `; but got ${args.length}: ${[...args.slice(1)]}`)
        }
        return true
    }

    const [operation, expectedArgs] = Command[command]
    // console.log({ operation, expectedArgs, args })

    operation
        ? checkArgs(expectedArgs) && await operation(...args)
        : console.log("Command not found: " + command + "\nRun --help for a list of available commands")

}

module.exports = { execute, Command }