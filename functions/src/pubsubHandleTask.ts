import * as _ from 'lodash';

async function pubsubHandleTask(message: any) {
    console.log(message);
    return null;
}

module.exports = pubsubHandleTask;
