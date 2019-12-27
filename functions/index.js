const functions = require("firebase-functions");
const { db } = require("./src/admin");
const createUserDocument = require("./src/createUserDocument");
const processTaskChanges = require("./src/processTaskChanges");
const chronFetchUpdatedTasks = require('./src/chronFetchUpdatedTasks');
const express = require("express");
const cors = require("cors");
const request = require("request");
const bodyParser = require("body-parser");

const app = express();

app.use(cors({ origin: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/:code/:uid", (req, res) => {
  var code = req.params.code;
  var uid = req.params.uid;
  var client_id = functions.config().todoist.client_id;
  var client_secret = functions.config().todoist.client_secret;
  var oauthOptions = {
    url: `https://todoist.com/oauth/access_token?code=${code}&client_id=${client_id}&client_secret=${client_secret}`,
    method: "POST"
  };
  request(oauthOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      var token = JSON.parse(body).access_token;
      var syncOptions = {
        url: `https://todoist.com/api/v7/sync?token=${token}&sync_token=*&resource_types=["user"]`,
        method: "GET"
      };
      request(syncOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          var syncBody = JSON.parse(body);
          console.log(syncBody);
          db.collection("users")
            .doc(uid)
            .set(
              {
                oauthToken: token,
                todoistLinked: true,
                todoistUserId: syncBody.user.id
              },
              { merge: true }
            );
          res.status(200).send("Success");
        } else {
          console.error(error);
          res.status(500).send("Failure");
        }
      });
    } else {
      console.log(error);
      console.log(body);
      res.status(500).send("Failure");
    }
  });
});

exports.createUserDocument = functions.auth.user().onCreate(createUserDocument);

exports.processTodoistOauth = functions.https.onRequest(app);

exports.processTaskChanges = functions.https.onRequest(processTaskChanges);

exports.chronFetchUpdatedTasks = functions.pubsub.schedule('*/5 * * * *').onRun(chronFetchUpdatedTasks);
