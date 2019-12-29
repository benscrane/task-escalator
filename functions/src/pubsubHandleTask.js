const _ = require("lodash");
const { db, rollbar } = require("./admin");

async function pubsubHandleTask(message) {
    console.log(message);
    return null;
}

module.exports = pubsubHandleTask;