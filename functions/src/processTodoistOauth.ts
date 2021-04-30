import { get } from 'lodash';
import { db, rollbar } from './admin';
import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import axios from 'axios';

export const processTodoistOauth = async (req: Request, res: Response) => {
    try {
        const code = get(req, 'query.code');
        const userId = get(req, 'query.uid');
        if (!code || !userId) {
            rollbar.error('Missing params');
            res.status(400).send('Missing Todoist code or user ID');
            return;
        }

        const accessToken = await requestAccessToken(code);
        const todoistId = await getTodoistId(accessToken);
        await saveTaskalatorUser({accessToken, userId, todoistId});

    } catch (err) {
        rollbar.error(err);
        res.status(500).send(err.message);
    }
};

export const requestAccessToken = async (code: string): Promise<string> => {
    const { clientId, clientSecret } = loadClientSecrets();
    const url = 'https://todoist.com/oauth/access_token';
    const body = {
        code,
        client_id: clientId,
        client_secret: clientSecret,
    };

    const response = await axios.post(url, body);
    const accessToken = get(response, 'data.access_token');
    if (!accessToken) {
        throw new Error('Problem retrieving access token');
    }

    return accessToken;
};

export const loadClientSecrets = () => {
    const clientId = functions.config().todoist.client_id;
    const clientSecret = functions.config().todoist.client_secret;

    return {
        clientId,
        clientSecret,
    };
};

export const getTodoistId = async (accessToken: string): Promise<string> => {
    const url = 'https://api.todoist.com/sync/v8/sync';
    const body = {
        token: accessToken,
        sync_token: '*',
        resource_types: ['user'],
    };
    const response = await axios.post(url, body);
    const todoistId = get(response, 'data.user.id');
    if (!todoistId) {
        throw new Error('Problem syncing Todoist user info');
    }

    return todoistId;
};

export interface SaveUserRequest {
    accessToken: string;
    userId: string;
    todoistId: string;
}

export const saveTaskalatorUser = async ({ accessToken, userId, todoistId }: SaveUserRequest): Promise<void> => {
    await db.collection('users')
        .doc(userId)
        .set({
            oauthToken: accessToken,
            todoistLinked: true,
            todoistUserId: todoistId,
        }, {
            merge: true,
        });
};
