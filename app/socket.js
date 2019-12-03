const auth = require("./auth.js");
const app = require("./app.js");
const validate = require("./validation.js");
const users = [];
async function connection (socket) {
    let token = socket.handshake.headers.authentication
    if (!token) return;

    if (!validate.token(token)) return;

    const tokenData = auth.destructToken(token);
    const user = await app.database.getUser(tokenData.id);
    if (!user) return;
    if (user.token != token) return;
    if (!users.includes(user.id)) {
        users.push(user.id)
    } else {
        socket.emit('kick')
        socket.disconnect()
    }

    console.log(users)
    socket.broadcast.emit('online', {
        id: user.id
    });
    socket.emit('online', {
        id: user.id
    });
    socket.on('disconnect', async () => {
        let token = socket.handshake.headers.authentication
        if (!token) return;

        if (!validate.token(token)) return;

        const tokenData = auth.destructToken(token);
        const user = await app.database.getUser(tokenData.id);
        if (!user) return;
        if (user.token != token) return;
        if (users.includes(user.id)) {
            users.splice(users.indexOf(user.id), 1)
        }
        socket.broadcast.emit('offline', {
            id: user.id
        });
        socket.emit('offline', {
            id: user.id
        });
    });
    socket.on("message_create", async data => {

        let { content, token, image } = data;
        if (!token) return;
        if (!content && !image) return
        if (content) {
            content = validate.cleanContent(content);
            if (!validate.content(content)) return;
        }
        if (!validate.token(token)) return;

        const tokenData = auth.destructToken(token);
        const user = await app.database.getUser(tokenData.id);
        if (!user) return;
        if (user.token != token) return;

        const id = app.snowflake.nextId();
        const timestamp = Date.now();
        const author = user.id;

        app.database.newMessage({ id, content, author, timestamp, image });
        socket.broadcast.emit('message_create', {
            id,
            content,
            author,
            timestamp,
            image
        });
        socket.emit('message_create', {
            id,
            content,
            author,
            timestamp,
            image
        });
    });
    socket.on("message_delete", async data => {
        let { id, token } = data;
        if (!id || !token) return;

        if (!validate.id(id)) return;
        if (!validate.token(token)) return;

        const tokenData = auth.destructToken(token);
        const user = await app.database.getUser(tokenData.id);
        if (!user) return;
        if (user.token != token) return;
        const messageData = await app.database.getMessage(id);
        if (messageData.author !== tokenData.id) return;
        app.database.deleteMessage(id);
        socket.broadcast.emit('message_delete', {
            id
        });
        socket.emit('message_delete', {
            id
        });
    });
    // socket.on("update_status", async data => {
    //     let { status, token } = data;
    //     if (!status || !token) return;

    //     if (!status >= 0 && !status > 3) return;
    //     if (!validate.token(token)) return;

    //     const tokenData = auth.destructToken(token);
    //     const user = await app.database.getUser(tokenData.id);
    //     if (!user) return;
    //     if (user.token != token) return;
    //     socket.broadcast.emit('update_status', {
    //         status,
    //         id: user.id
    //     });
    //     socket.emit('update_status', {
    //         status,
    //         id: user.id
    //     });

    // });
    // socket.on("message_edit", async data => {
    //     let { id, token, content } = data;
    //     if (!id || !token) return;

    //     if (!validate.id(id)) return;
    //     if (!validate.token(token)) return;
    //     const tokenData = auth.destructToken(token);
    //     const user = await app.database.getUser(tokenData.id);
    //     if (!user) return;
    //     if (user.token != token) return;
    //     const messageData = await app.database.getMessage(id);
    //     if (messageData.author !== tokenData.id) return;
    //     if (!content) {
    //         app.database.deleteMessage(id);
    //         socket.broadcast.emit('message_edit', {
    //             id
    //         });
    //         socket.emit('message_edit', {
    //             id
    //         });
    //     }
    // });
}

module.exports = connection;