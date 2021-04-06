import * as PubSub from '@google-cloud/pubsub';
import * as _ from 'lodash';
import { rollbar } from './admin';
import {
    PubsubMessageData,
    TaskPubSubMessage,
} from './types';

// tslint:disable:no-any

export const chronFetchUpdatedTasks = async () => {
    const client = getPubSubClient();
    const messages = await fetchPubSubMessages(client);
    const { ackIds, todoistUids } = processMessages(messages);
    await ackMessages(client, ackIds);
    await publishTodoistIds(todoistUids);
    return null;
};

export const getPubSubClient = () => {
    return new PubSub.v1.SubscriberClient();
};

export const fetchPubSubMessages = async (client: any): Promise<TaskPubSubMessage[]> => {
    const subscription = getSubscriptionPath(client);
    try {
        const [response] = await client.pull({
            subscription,
            maxMessages: 100,
            returnImmediately: true,
        });
        const messages: TaskPubSubMessage[] = response.receivedMessages;
        return messages;
    } catch (err) {
        rollbar.error(err);
        throw err;
    }
};

export const getSubscriptionPath = (client: any) => {
    const projectName = 'taskalator';
    const pullSubscription = 'pull-todoist-updates';
    const formattedPullPath = client.subscriptionPath(
        projectName,
        pullSubscription,
    );
    return formattedPullPath;
};

export const processMessages = (messages: TaskPubSubMessage[]): { ackIds: string[], todoistUids: string[] } => {
    const reducer = (current: {ackIds: string[], todoistUids: string[]}, message: TaskPubSubMessage) => {
        const data = extractDataFromMsg(message);
        const todoistId = data.todoistId;
        if (todoistId && !current.todoistUids.includes(todoistId)) {
            return {
                ackIds: [
                    ...current.ackIds,
                    message.ackId,
                ],
                todoistUids: [
                    ...current.todoistUids,
                    todoistId,
                ],
            };
        }
        return {
            ackIds: [
                ...current.ackIds,
                message.ackId,
            ],
            todoistUids: current.todoistUids,
        };
    };
    const { ackIds, todoistUids } = messages.reduce(reducer, { ackIds: [], todoistUids: [] });
    return {
        ackIds,
        todoistUids,
    };
};

export const  extractDataFromMsg = (message: TaskPubSubMessage): PubsubMessageData => {
    const buff = Buffer.from(message.message.data, "base64");
    const text = buff.toString('utf-8');
    const data: PubsubMessageData = JSON.parse(text);
    return data;
};

export const ackMessages = async (client: any, ackIds: string[]) => {
    const subscription = getSubscriptionPath(client);
    if (ackIds.length > 0) {
        try {
            await client.acknowledge({
                subscription,
                ackIds,
            });
        } catch (err) {
            rollbar.error(err);
            throw new Error('Failed to acknowledge');
        }
    }
};

export const publishTodoistIds = async (todoistUids: string[]) => {
    const pubsub = new PubSub.PubSub();
    const pushTopic = "sync-user";
    for (const uid of todoistUids) {
        // publish message
        const data: PubsubMessageData = {
            todoistId: uid
        };
        const dataBuffer = Buffer.from(JSON.stringify(data));
        try {
            await pubsub.topic(pushTopic).publish(dataBuffer);
        } catch (error) {
            rollbar.error('Problem pushing userID to pubsub topic', {
                error,
            });
        }
    }
};
