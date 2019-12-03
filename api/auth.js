const express = require("express");
const auth = require("../app/auth.js");
const validate = require("../app/validation.js");

async function post (req, res) {
    if (!await passwordAuth(req, res))
        res.send({ ok: false });
}

async function passwordAuth (req, res) {
    // Password authentication
    // Return a token to be set in local storage, then redirect to chat with that token
    // If token fails they return here
    if (!req.body.user || !req.body.pass) return;

    let { user, pass } = req.body;
    pass = Buffer.from(pass, "base64").toString();
    if (!validate.username(user) || !validate.password(pass))
        return;

    const userData = await req.app.database.getUserByName(user);

    if (!userData) return;

    if (!(await auth.comparePass(pass, userData.password)))
        return;

    res.send({ ok: true, token: userData.token });
    return true;
}

module.exports = post;