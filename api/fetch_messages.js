const express = require("express");
const validate = require("../app/validation.js");
const auth = require("../app/auth.js");
const app = require("../app/app.js");

async function post (req, res) {
    await fetchMessage(req, res);
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function fetchMessage (req, res) {
    if (!req.body.token) return res.send({ ok: false });

    let token = req.body.token;
    if (!validate.token(token)) return res.send({ ok: false });
    const tokenData = auth.destructToken(token);
    const user = await app.database.getUser(tokenData.id);
    if (!user) return;
    if (user.token != token) return;
    const messages = await req.app.database.fetchMessages();
    if (!messages) return res.send({ ok: false });
    res.send({ ok: true, messages: messages });
}

module.exports = post;