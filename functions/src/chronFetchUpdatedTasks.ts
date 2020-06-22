import * as PubSub from '@google-cloud/pubsub';
import * as _ from 'lodash';
import { rollbar } from './admin';

const client = new PubSub.v1.SubscriberClient();
const pubsub = new PubSub.PubSub();

const projectName = "taskalator";
const pullSubscription = "pull-todoist-updates";
const pushTopic = "sync-user";
const formattedPullPath = client.subscriptionPath(
    projectName,
    pullSubscription
);
const maxMessages = 100;
const request = {
    subscription: formattedPullPath,
    maxMessages,
    returnImmediately: true,
};

function extractDataFromMsg(message: any) {
    const buff = Buffer.from(message.message.data, "base64");
    const text = buff.toString('utf-8');
    const data = JSON.parse(text);
    return data;
}

export const chronFetchUpdatedTasks = async () => {
    // pull events from todoist-updates
    let messages: any[] = [];
    try {
        const [response] = await client.pull(request);
        messages = response.receivedMessages;
    } catch (err) {
        rollbar.error(err);
    }
    if (messages.length === 0) return null; // skip processing if no messages
    const ackIds = [];
    const todoistUids = [];
    // console.log(messages);
    for (const message of messages) {
        const data = extractDataFromMsg(message);
        const todoistUid = _.get(data, "todoistId");
        if (todoistUid) {
            todoistUids.push(todoistUid);
        }
        ackIds.push(_.get(message, "ackId"));
    }
    const ackRequest = {
        subscription: formattedPullPath,
        ackIds,
    }
    // acknowledge messages
    if (ackIds.length > 0) {
        await client.acknowledge(ackRequest);
    }
    // remove duplicates
    const filteredTodoistUids = [...new Set(todoistUids)];
    // publish events to sync-user
    for (const uid of filteredTodoistUids) {
        // publish message
        const data = {
            todoistId: uid
        };
        const dataBuffer = Buffer.from(JSON.stringify(data));
        pubsub.topic(pushTopic).publish(dataBuffer);
        try {
            pubsub.topic(pushTopic).publish(dataBuffer);
        } catch (error) {
            rollbar.error('Problem pushing userID to pubsub topic', {
                error,
            });
        }
    }
    return null;
}
