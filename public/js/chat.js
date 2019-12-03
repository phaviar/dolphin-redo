Vue.directive("tap", {
    bind: function (element, binding) {
        if (typeof binding.value === "function") {
            const hammer = new Hammer(element);
            hammer.on("tap", binding.value);
        }
    }
});

const closePanel = el => {
    if (el.classList.contains("right-panel")) {
        el.classList.replace("slideInRight", "slideOutRight");
    } else {
        el.classList.replace("slideInLeft", "slideOutLeft");
    }
    el.addEventListener(
        "animationend",
        () => {
            el.removeAttribute("style");
            if (el.classList.contains("right-panel")) {
                el.classList.remove("slideOutRight");
            } else {
                el.classList.remove("slideOutLeft");
            }
        }, {
            once: true
        }
    );
};
var token = localStorage.getItem("token");
var currentFile;
if (!token) window.location.replace("/login");
var id = atob(token).split(".")[0];
var username;
var cache = {};
var messages;
var drop = new Audio();
drop.src = "/assets/drop.mp3";
axios.defaults.headers.common["Authorization"] = token;
var messagebody = document.getElementsByClassName("messages")[0]; // This is used to control the scroll of the messages.

// if (location.protocol != "https:")
// {
//  location.href = "https:" + window.location.href.substring(window.location.protocol.length);
// }
// let video = document.getElementById("call");

var socket = io.connect(window.location.href, {
    transportOptions: {
        polling: {
            extraHeaders: {
                authentication: token
            }
        }
    }
});

async function getUsername (id) {
    let response = await fetch("/api/fetchuser", {
        // Load vals
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: id })
    });
    let parsed = await response.json();
    if (parsed.username) {
        return parsed.username;
    } else {
        return;
    }
}
async function fetchMessages () {
    return new Promise((resolve, reject) => {
        fetch("/api/fetchmessages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token: token })
            })
            .then(function (response) {
                return response.json();
            })
            .then(parsed => {
                if (parsed.messages) {
                    resolve(parsed.messages);
                } else {
                    reject();
                }
            })
            .catch(console.log);
    });
}
async function fetchPanel () {
    let response = await fetch("/api/fetchpanel", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ok: true })
    });

    let parsed = await response.json();
    console.log(parsed);
    let online = parsed.online.map(async each => {
        if (!each) return;
        console.log(each);
        let name = cache[each] ? cache[each].username : await getUsername(each);
        console.log(name);
        return { name: name, id: each };
    });
    let offline = parsed.offline.map(async each => {
        if (!each) return;
        console.log(each);
        let name = cache[each] ? cache[each].username : await getUsername(each);
        console.log(name);

        return { name: name, id: each };
    });
    return {
        online: await Promise.all(online),
        offline: await Promise.all(offline)
    };
}

function init () {
    return new Promise((resolve, reject) => {
        getUsername(id)
            .then(usernameReturned => {
                username = usernameReturned;
            })
            .catch(console.log);
        fetchMessages()
            .then(async messagesReturned => {
                for (let index = 0; index < messagesReturned.length; index++) {
                    const message = messagesReturned[index];
                    if (!cache[message.author]) {
                        await getUsername(message.author)
                            .then(name => {
                                cache[message.author] = {
                                    username: name
                                };
                                message.ausername = name;
                            })
                            .catch(console.log);
                    } else {
                        message.ausername = cache[message.author].username;
                    }
                } // Cache usernames & use them
                messages = messagesReturned.sort((a, b) => {
                    return a.timestamp - b.timestamp; // Sort messages by timestamp.
                });

                resolve(messagesReturned);
            })
            .catch(console.log);
    });
}
(async () => {
    messages = await init(); // This initalizes the message history & the logged in user"s info.
    const peer = new Peer(id, { host: window.location.host, port: 9000, path: "/peer" });

    const result = await fetchPanel();
    const online = Array.from(result.online);
    const offline = Array.from(result.offline);
    console.log(online, offline)
    const voicechat = [];
    // CREATE VUE INSTANCE
    const app = new Vue({
        el: "#app",
        data () {
            return {
                messages: messages,
                username: username,
                id: id,
                online: online,
                offline: offline,
                voicechat: voicechat
            };
        },
        methods: {
            formatDate (date) {
                return moment(date).fromNow();
            },
            imageUrlAlt (event) {
                event.target.src = "/assets/avatar.png";
            },
            getImageUrl: function (mid) {
                return "/assets/avatars/" + mid + ".png" + "?" + new Date().getTime();
            },
            compiledMarkdown: text => {
                return marked(text, { sanitize: true });
            },
            closeModal (e) {
                let modal_darken = e.target;
                let modal_content = document.getElementsByClassName("modal-content")[0]
                // let modal = document.getElementsByClassName("modal")[0]
                modal_darken.classList.replace("fadeIn", "fadeOut")
                modal_content.classList.replace("zoomIn", "zoomOut")
                // modal.classList.replace("enabled", "disabled")

                // modal.addEventListener(
                //   "animationend",
                //   () => {
                //     modal.setAttribute("style", "filter: none;-webkit-filter: none;transform: scale(1.0)")
                //   },
                //   {
                //     once: true
                //   }
                // );
                modal_content.addEventListener(
                    "animationend",
                    () => {
                        modal_content.classList.add("none")
                        modal_content.classList.replace("zoomOut", "zoomIn")
                    }, {
                        once: true
                    }
                );
                modal_darken.addEventListener(
                    "animationend",
                    () => {
                        modal_darken.classList.add("none")
                        modal_darken.classList.replace("fadeOut", "fadeIn")
                    }, {
                        once: true
                    }
                );
            },
            openModal: async function (call, stream) {
                let modal_darken = document.getElementsByClassName("modal-darken")[0]
                let modal_content = document.getElementsByClassName("modal-content")[0]
                // let modal = document.getElementsByClassName("modal")[0]
                let answer = document.getElementsByClassName("answer-call")[0]
                let decline = document.getElementsByClassName("decline-call")[0]
                let text = document.querySelector("#app > div.modal-content > div > h3")
                let image = document.querySelector("#app > div.modal-content > div > p > img")
                let id = call.peer;
                let name = cache[id] ? cache[id].username : await getUsername(id);
                text.innerText = name;
                image.src = this.getImageUrl(id)

                // modal.removeAttribute("style")
                // modal.classList.replace("disabled", "enabled")
                modal_content.classList.remove("none")
                modal_darken.classList.remove("none")
                answer.addEventListener(
                    "click",
                    async () => {
                        call.answer(stream);
                        let e = { target: modal_darken }
                        this.closeModal(e)
                    }, {
                        once: true
                    }
                );
                decline.addEventListener(
                    "click",
                    async () => {
                        call.close();
                        let e = { target: modal_darken }
                        this.closeModal(e)
                    }, {
                        once: true
                    }
                );
            },
            onTap (e) {
                if (screen.width < 700) {
                    let rightpanel = document.getElementsByClassName("right-panel")[0];
                    let leftpanel = document.getElementsByClassName("left-panel")[0];

                    if (rightpanel.getAttribute("style") === "display: block;") {
                        closePanel(rightpanel);
                    }
                    if (leftpanel.getAttribute("style") === "display: block;") {
                        closePanel(leftpanel);
                    }
                }
            },
            upload () {
                let avatar = document.getElementById("avatar-up").files[0];
                let formData = new FormData();
                formData.append("file", avatar);
                axios.post("/api/uploadavatar", formData);
            },
            uploadImg () {
                let img = document.getElementById("image-up").files[0];
                let formData = new FormData();
                formData.append("file", img);
                axios.post("/api/uploadimages", formData).then(r => {
                    socket.emit("message_create", {
                        token: token,
                        content: input_message.value.trim() ? input_message.value : null,
                        image: r.data.imgs
                    });
                    input_message.value = "";
                    input_message.blur();
                });
            },
            uploadPrompt () {
                let avatar = document.getElementById("avatar-up");
                avatar.click();
            },
            uploadPromptImg () {
                let img = document.getElementById("image-up");
                img.click();
            },
            scroll () {
                document.querySelector("#test > div").scrollTop = 999999;
            },
            showExtras (msg) {
                const message = messages[messages.indexOf(messages.find(m => m.id === msg))]
                const lastMessage = messages[messages.indexOf(messages.find(m => m.id === msg)) - 1]
                if (!lastMessage) return true
                if ((message.author === lastMessage.author) === false) return true
                return (message.timestamp - lastMessage.timestamp > 60000)
            },
            call: function (user) {
                navigator.getUserMedia({ video: false, audio: true },
                    function (stream) {
                        var call = peer.call(user, stream);
                        voicechat.push({ name: username, id: id });
                        call.on("stream", function (remoteStream) {
                            var audio = document.getElementById("call");
                            audio.srcObject = remoteStream;
                        });
                        call.on("error", function () { console.log("sadly"); });
                        call.on("close", function () {
                            voicechat.splice(
                                voicechat.indexOf(voicechat.find(p => p.id === id)),
                                1
                            );
                        })
                    },
                    function (err) {
                        console.log("Failed to get local stream", err);
                    }
                );
            }
        },
        mounted: () => {
            var el = document.querySelector("#test");
            console.log(el);
            var hammer = new Hammer(el);
            hammer.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
            hammer.on("pan", e => {
                if (screen.width < 700) {
                    var distance = e.distance * 0.3;
                    if (distance > 20) distance = e.distance * 0.4;
                    if (distance > 150) {
                        if (e.direction === Hammer.DIRECTION_LEFT) {
                            let rightpanel = document.getElementsByClassName("right-panel")[0];
                            let leftpanel = document.getElementsByClassName("left-panel")[0];
                            if (leftpanel.getAttribute("style") === "display: block;") {
                                closePanel(leftpanel);
                            } else {
                                rightpanel.setAttribute("style", "display: block;");
                                rightpanel.classList.add("slideInRight");
                            }
                        } else if (e.direction === Hammer.DIRECTION_RIGHT) {
                            let rightpanel = document.getElementsByClassName("right-panel")[0];
                            let leftpanel = document.getElementsByClassName("left-panel")[0];
                            if (rightpanel.getAttribute("style") === "display: block;") {
                                closePanel(rightpanel);
                            } else {
                                leftpanel.setAttribute("style", "display: block;");
                                leftpanel.classList.add("slideInLeft");
                            }
                        }
                    }
                }
            });
            document.querySelector("#test > div").scrollTop = 999999;
        }
    });
    peer.on("call", function (call) {
        navigator.getUserMedia({ video: false, audio: true },
            function (stream) {
                app.openModal(call, stream)
                call.on("stream", async function (remoteStream) {
                    var audio = document.getElementById("call");
                    audio.srcObject = remoteStream;
                });
            },
            function (err) {
                console.log("Failed to get local stream", err);
            }
        );
    });
    // SOCKET IO LISTENERS
    socket.on("message_create", async data => messageCreate(app, data));
    socket.on("message_delete", async data => messageDelete(app, data));
    socket.on("offline", async data => offlineEvent(app, data));
    socket.on("online", async data => onlineEvent(app, data));
    socket.on("disconnect", () => {
        window.location.replace("/login");
    });
    socket.on("kick", () => {
        window.location.replace("/logged-in");
    });

    // DOM
    var global = document.querySelector("html"); // Global DOM, used for click & keyboard events
    var input_message = document.getElementById("type-area");

    input_message.addEventListener("keypress", event => {
        // Check if the user doesn"t mean new line and send.
        if (event.keyCode == 13 && !event.shiftKey) {
            if (input_message.value.trim().length > 0) {
                socket.emit("message_create", {
                    token: token,
                    content: input_message.value
                });
                input_message.value = "";
                // Un focus the message send textbox, don"t worry we auto refocus it when they start typing again
                input_message.blur();
            } else {
                input_message.blur();
            }
        }
    });

    global.addEventListener("keypress", event => {
        if (event.target.id === messagebody.id) {
            input_message.focus();
        }
    });
})();