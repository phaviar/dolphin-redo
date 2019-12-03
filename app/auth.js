const bcrypt = require("bcrypt");

class Auth {
    static get chepoch() {
        return 1543303383712;
    }

    static async createHash (pass) {
        const salt = await bcrypt.genSalt();
        return bcrypt.hash(pass, salt);
    }

    static comparePass(pass, encrypted) {
        return bcrypt.compare(pass, encrypted);
    }

    static createToken(id) {
        // id . random . timestamp
        const random = new Array(10).fill(0).map(_ => randomChar()).join ``;
        const timestamp = Date.now() - Auth.chepoch;
        const token = `${id}.${random}.${timestamp}`;

        return Buffer.from(token).toString("base64");
    }

    static destructToken(token) {
        const data = Buffer.from(token, "base64").toString();

        let [id, random, timestamp] = data.split(".");
        timestamp = new Date(parseInt(timestamp) + Auth.chepoch);

        return { id, random, timestamp };
    }
}

function randomChar () {
    const random = Math.round(Math.random() * 222) + 33;
    return String.fromCharCode(random);
}

module.exports = Auth;