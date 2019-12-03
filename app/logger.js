const chalk = require("chalk");
const util = require("util");
const debug = true;

const log = (style, name, message, stacktrace) => {
    if (typeof style !== "function")
        style = chalk.white;

    if (Array.isArray(message))
        message = message.map(m => m.toString()).join('\n');

    if (typeof message === "object" || typeof message === "function")
        message = util.inspect(message);

    console.log(style.bold(`[${name.toUpperCase()}]`), style(message));

    if (stacktrace)
        console.trace(stacktrace);
};

class Logger {
    static success(name = "SUCCESS", message) {
        log(chalk.green, name, message);
    }

    static warn(name = "WARN", message) {
        log(chalk.yellow, name, message);
    }

    static info(name = "INFO", message) {
        log(chalk.white, name, message);
    }

    static error(name = "ERROR", message, stacktrace) {
        log(chalk.red, name, message, stacktrace);
    }

    static fatal(name = "FATAL", message, stacktrace) {
        log(chalk.bgRed.white, name, message, stacktrace);
        process.exit(0);
    }

    static debug(name = "DEBUG", message, stacktrace) {
        if (debug) log(chalk.purple, message, stacktrace);
    }
}

module.exports = Logger;