const token = localStorage.getItem("token");
if (!token) window.location.replace("/login");

const id = atob(token).split(".")[0];
const username;
var cache = {};
var messages;

const socket = io.connect(window.location.href, {
    transportOptions: {
        polling: {
            extraHeaders: {
                "authentication": token
            }
        }
    }
})