const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const dotenv = require('dotenv');

dotenv.config();
const prod = process.env.NODE_ENV === "dev" ? false : true;
const app = express();

const privateKey = (prod) ? fs.readFileSync('credentials/server.key', 'utf8') : null;
const certificate = (prod) ? fs.readFileSync('credentials/server.crt', 'utf8') : null;
const credentials = (prod) ? { key: privateKey, cert: certificate } : null;

const httpServer = require("http").Server(app);
const httpsServer = (prod) ? require("https").Server(credentials, app) : null;
const io = (prod) ? require("socket.io")(httpsServer) : require("socket.io")(httpServer);

const PeerServer = require('peer').PeerServer;
const path = require("path");

app.io = io;
module.exports = app;

const Snowflake = require("./snowflake.js");
const RateLimiter = require("./ratelimiter.js");
const Database = require("./database");
const validate = require("./validation");
const logger = require("./logger.js");
const auth = require("./auth");
const socketHandler = require("./socket.js");
const port = 80;
const maxImageSize = 52428800;

// API
const apiAuth = require("../api/auth.js");
const apiNewUser = require("../api/new_user.js");
const apiFetchUser = require("../api/fetch_user.js");
const apiFetchPanel = require("../api/fetch_panel.js");
const apiFetchMessages = require("../api/fetch_messages.js");
const apiUploadAvatar = require("../api/upload_avatar.js");
const apiUploadImages = require("../api/upload_images.js");

app.snowflake = new Snowflake();
app.limiter = new RateLimiter(3, 5);
app.database = new Database();

// Place public in static space
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload({
    safeFileNames: true,
    limits: {
        fileSize: maxImageSize
    }
}));


// Setup html serving
app.get("/signup", (req, res) => {
    res.sendFile(process.cwd() + "/views/signup.html");
});
app.get("/login", (req, res) => {
    res.sendFile(process.cwd() + "/views/login.html");
});
app.get("/chat", (req, res) => {
    res.sendFile(process.cwd() + "/views/chat.html");
});
app.get("*", (req, res) => {
    res.sendFile(process.cwd() + "/views/404.html");
});

// Setup api endpoints
app.post("/api/new_user", apiNewUser);
app.post("/api/auth", apiAuth);
app.post("/api/fetchuser", apiFetchUser);
app.post("/api/fetchmessages", apiFetchMessages);
app.post("/api/fetchpanel", apiFetchPanel);
app.post("/api/uploadavatar", apiUploadAvatar);
app.post("/api/uploadimages", apiUploadImages);

const server = (prod) ? PeerServer({ port: 9000, path: '/peer', ssl: credentials }) : PeerServer({ port: 9000, path: '/peer' });

// Create socket connection only for /chat endpoint
io.of("/chat").on("connection", socketHandler);

// Start the server
httpServer.listen(port, () => logger.info('app', 'Listening on 80'));
if (prod) httpsServer.listen(443, () => logger.info('app', 'Listening on 443'));

server.on('connection', (client) => {
    logger.success('peer', `Peer connected. ${client}`)
});
server.on('disconnect', (client) => {
    logger.error('peer', `Peer disconnected. ${client}`)
});