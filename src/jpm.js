

const commander = require("commander");
const chalk = require("chalk");
const packageJson = require("../package.json");
const { execute, Command } = require("./commands");

async function jpm() {
    const program = new commander.Command(packageJson.name)
        .version(packageJson.version)
        .arguments("<command> [pkg-name]")
        .option("--trace", "Use trace")
        .usage(`${chalk.green("<add | remove | publish | delist>")} [package-name[^version]]`)
        .on("--help", () => {
            console.log(
                chalk.cyanBright(`
                Jolie Package Manager is used to install Jolie dependencies.
                Find out more at https://jolie-lang.org
                `)
            );
            console.log("Available commands: ")
            console.log(Object.values(Command).join(", "))
        })
        .parse(process.argv);

    const [command, args] = [program.args[0], [...program.args.slice(1)]];
    const options = program._optionValues

    try {
        // console.log({ command, args, options: program._optionValues })
        await execute(command, args)
    } catch (error) {
        options.trace
            ? console.trace(error.message)
            : console.log(error.message)
    }
}

module.exports = { jpm }