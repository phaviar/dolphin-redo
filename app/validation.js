const auth = require("./auth.js");

const usernameRegex = /^[A-Za-z0-9_]{3,32}$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,100}$/;

const idRegex = /^[0-9]{15,25}$/;
const tokenDecay = 604800000; // 7 days;

class Validation {
    static username(u) {
        return usernameRegex.test(u);
    }

    static password(p) {
        return passwordRegex.test(p);
    }

    static id(i) {
        return idRegex.test(i);
    }

    static token(t) {
        const data = auth.destructToken(t);
        if (!data.id || !data.random || !data.timestamp) return false;
        return Validation.id(data.id) &&
            data.random.length === 10 &&
            new Date(data.timestamp).toString() !== "Invalid Date";
    }

    static content(c) {
        return c.length > 0 && c.length < 5000;
    }

    static cleanContent(c) {
        // Fool Proof
        return c.replace(/<|>/g, '');
    }
}

module.exports = Validation;