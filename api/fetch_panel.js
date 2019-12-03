const express = require("express");
const auth = require("../app/auth.js");
const validate = require("../app/validation.js");

async function post (req, res) {
    await fetchPanel(req, res);
}
/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function fetchPanel (req, res) {
    let users = await req.app.database.fetchUsers();
    if (!users) return res.send({ ok: false });
    users = users.map(user => user.id)
    let sockets = req.app.io.sockets.connected
    let online = [];
    for (i in sockets) {
        let socket = sockets[i]
        let id = await auth.destructToken(socket.handshake.headers.authentication).id;
        if (!online.includes(id) && id) online.push(id);
    }
    let offline = users.filter((user) => !online.includes(user))

    console.log(online, offline)
    res.send({ ok: true, online: online, offline: offline });
}

module.exports = post;