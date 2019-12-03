const express = require("express");
const auth = require("../app/auth.js");
const validate = require("../app/validation.js");

async function post (req, res) {
    await fetchUser(req, res);
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function fetchUser (req, res) {
    if (!req.body.id) return res.send({ ok: false });

    let id = req.body.id;
    if (!validate.id(id)) return res.send({ ok: false });

    const user = await req.app.database.getUser(id);
    if (!user) return res.send({ ok: false });
    res.send({ ok: true, username: user.username });
}

module.exports = post;