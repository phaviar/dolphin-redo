const auth = require("./auth.js");

class Snowflake {
    constructor() {
        this.sequenceId = 0;
        this.workerId = parseInt(process.env["WORKER_ID"]) || 0;
        this.processId = parseInt(process.env["PROCESS_ID"]) || 0;
    }

    nextId() {
        let timestamp = decToBin(Date.now() - auth.chepoch, 42);
        let worker = decToBin(this.workerId, 5);
        let process = decToBin(this.processId, 5);
        let sequence = decToBin(this.sequenceId++, 12);

        if (this.sequenceId > 4095) this.sequenceId = 0;

        const bin = timestamp + worker + process + sequence;
        return parseInt(bin, 2) + "";
    }

    destruct(snowflake) {
        let bin = decToBin(parseInt(snowflake), 64);

        let timestamp = bin.substr(0, 42);
        let worker = bin.substr(42, 5);
        let process = bin.substr(47, 5);
        let sequence = bin.substr(52, 12);

        timestamp = new Date(parseInt(timestamp, 2) + auth.chepoch);
        worker = parseInt(worker, 2);
        process = parseInt(process, 2);
        sequence = parseInt(sequence, 2);

        return { timestamp, worker, process, sequence };
    }
}

function decToBin (dec, pad) {
    const bin = dec.toString(2);
    return ("0".repeat(pad) + bin).slice(-pad);
}

module.exports = Snowflake;