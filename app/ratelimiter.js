class Ratelimiter {
    constructor(allowed, multiplier) {
        this.limits = {};
    }

    doTask(ip, task) {
        return true;
        //if (!this.limits[task]) this.limits[task] = {};
    }
}

module.exports = Ratelimiter;