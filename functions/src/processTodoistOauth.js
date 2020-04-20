const { db, rollbar } = require("./admin.js");
const util = require('util');
const axios = require('axios');
const _ = require('lodash');
const functions = require('firebase-functions');
const cors = require('cors')({
    origin: true,
});

const processTodoistOauth = async (req, res) => {
    return cors(req, res, async() => {
        const code = _.get(req, 'query.code');
        const userId = _.get(req, 'query.uid');
        // TODO: fix this temporary scoping issue
        let accessToken;
        if (!code || !userId) {
            rollbar.error('Missing params');
            res.status(500).send('Missing Todoist code or user ID');
        }

        const clientId = functions.config().todoist.client_id;
        const clientSecret = functions.config().todoist.client_secret;
        const oauthUrl = `https://todoist.com/oauth/access_token`;
        const oauthBody = {
            code,
            client_id: clientId,
            client_secret: clientSecret,
        };
        try {
            const oauthResponse = await axios.post(oauthUrl, oauthBody);
            const tempAccessToken = _.get(oauthResponse, 'data.access_token');
            if (!tempAccessToken) {
                throw new Error('Problem retrieving access token');
            }
            accessToken = tempAccessToken;
        } catch (err) {
            rollbar.error(err);
            res.status(500).send(JSON.stringify(err));
        }

        try {
            // sync user
            // TODO: split into it's own function
            const syncUrl = 'https://api.todoist.com/sync/v8/sync';
            const syncBody = {
                token: accessToken,
                sync_token: '*',
                resource_types: ['user'],
            };
            const syncResponse = await axios.post(syncUrl, syncBody);
            const todoistUserId = _.get(syncResponse, 'data.user.id');
            if (!todoistUserId) {
                throw new Error('Problem retrieving Todoist user ID');
            }
            await db.collection('users')
                .doc(userId)
                .set({
                    oauthToken: accessToken,
                    todoistLinked: true,
                    todoistUserId,
                }, {
                    merge: true,
                });
            res.status(200).send('Success');
        } catch (err) {
            rollbar.error(err);
            res.status(500).send(JSON.stringify(err));
        }
    });
};

module.exports = processTodoistOauth;