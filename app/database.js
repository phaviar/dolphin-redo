const r = require("rethinkdbdash")({ db: "ChatApp" });

class Database {
    async getUser (id) {
        return await r.table("users").get(id);
    }

    async getUserByName (name) {
        const users = await r.table("users").filter({ username: name });
        return users ? users[0] : null;
    }

    async hasUsername (name) {
        return await r.table("users").filter({ username: name }).count() > 0;
    }

    async newUser ({ id, username, password, token }) {
        await r.table("users").insert({ id, username, password, token });
    }

    async updateUser (id, { username, password, icon, token }) {
        await r.table("users").get(id).update({ username, password, icon, token });
    }

    async deleteUser (id) {
        await r.table("users").get(id).delete();
    }

    async newMessage ({ id, author, content, timestamp, image }) {
        await r.table("messages").insert({ id, author, content, timestamp, image });
    }

    async deleteMessage (id) {
        await r.table("messages").get(id).delete();
    }
    async getMessage (id) {
        return await r.table("messages").get(id);
    }
    async inChannel (user, channel) {
        //  return await r.table("users").get(user).channels.includes(channel)
    }
    async fetchMessages () {
        return await r.table("messages");
    }
    async fetchUsers () {
        return await r.table("users");
    }
}

module.exports = Database;