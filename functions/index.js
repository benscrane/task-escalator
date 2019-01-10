const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const request = require("request");
const bodyParser = require("body-parser");

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

const app = express();

app.use(cors({ origin: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/:code/:uid", (req, res) => {
  var code = req.params.code;
  var uid = req.params.uid;
  var client_id = "c6f183f8c7124cabb5a15ec8fcfbba60";
  var client_secret = "e8dc8282fdc847efa4288158b709e594";
  var options = {
    url: `https://todoist.com/oauth/access_token?code=${code}&client_id=${client_id}&client_secret=${client_secret}`,
    method: "POST"
  };
  request(options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      var token = JSON.parse(body).access_token;
      db.collection("users")
        .doc(uid)
        .set(
          {
            oauthToken: token,
            todoistLinked: true
          },
          { merge: true }
        );
      res.status(200).send("Success");
    } else {
      console.log(error);
      console.log(body);
      res.status(500).send("Failure");
    }
  });
});

exports.createUserDocument = functions.auth.user().onCreate(user => {
  var docRef = db.collection("users").doc(user.uid);
  var setUser = docRef.set(
    {
      todoistLinked: false
    },
    { merge: true }
  );
  return setUser;
});

exports.processTodoistOauth = functions.https.onRequest(app);
