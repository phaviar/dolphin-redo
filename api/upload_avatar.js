const express = require("express");
const sharp = require("sharp");
const path = require("path");

const validate = require("../app/validation.js");
const auth = require("../app/auth.js");
const app = require("../app/app.js");

const maxAvatarSize = 1048576;

async function post (req, res) {
    await uploadAvatar(req, res);
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function uploadAvatar (req, res) {
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

    if (file.size > maxAvatarSize) return res.send({ ok: false });
    sharp(file.data)
        .resize(128, 128)
        .toFile(
            path.join(__dirname, "../public/assets/avatars/" + tokenData.id + ".png")
        );
    app.io.of("/chat").emit('avatar', { id: tokenData.id })
    res.send(200)
}

module.exports = post;