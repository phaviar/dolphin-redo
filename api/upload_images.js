const express = require("express");
const sharp = require("sharp");
const path = require("path");

const validate = require("../app/validation.js");
const auth = require("../app/auth.js");
const app = require("../app/app.js");

const maxImageSize = 52428800;

async function post (req, res) {
    await uploadImages(req, res);
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function uploadImages (req, res) {
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    if (!token) return res.send({ ok: false });
    if (!validate.token(token)) return res.send({ ok: false });
    const tokenData = auth.destructToken(token);
    const user = await app.database.getUser(tokenData.id);
    if (!user) return res.send({ ok: false });
    if (user.token != token) return res.send({ ok: false });

    let file = req.files.file;
    if (!file) return res.send({ ok: false });
    if (
        (file.mimetype === "image/jpeg" || file.mimetype === "image/png") === false
    )
        return res.send({ ok: false });

    if (file.size > maxImageSize) return res.send({ ok: false });
    let snow = app.snowflake.nextId()
    file.mv(
        __dirname + "/../public/assets/messages/" + snow + ".png"
    );

    res.send({ imgs: snow });
}

module.exports = post;