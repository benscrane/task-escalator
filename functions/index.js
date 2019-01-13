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

exports.processTaskChanges = functions.https.onRequest((request, response) => {
  // We only care about item:updated and item:added
  if (
    request.body.event_name !== "item:updated" &&
    request.body.event_name !== "item:added"
  ) {
    response.status(200).send();
  }
  console.log(request.body);
  var taskId = String(request.body.event_data.id);
  var userUid = "";
  //Get the user document from the todoist ID (request.body.user_id)
  var userQuery = db
    .collection("users")
    .where("todoistUserId", "==", Number(request.body.user_id))
    .get();
  var userDocId = userQuery
    .then(querySnapshot => {
      userUid = querySnapshot.docs[0].id;
      return userUid;
    })
    .catch(error => {
      console.error(error);
    });
  // get the tracked tasks collection from the user's document
  var trackedTasksCollection = userDocId
    .then(docId => {
      return db
        .collection("users")
        .doc(docId)
        .collection("trackedTasks");
    })
    .catch(error => {
      console.error(error);
    });
  // get the tracked task document with the todoist task ID
  var existingTask = trackedTasksCollection
    .then(collection => {
      return collection.doc(taskId).get();
    })
    .catch(error => {
      console.error(error);
    });
  // get a true or false value based on whether a document with the todoist task id exists
  var doesTaskExist = existingTask
    .then(docSnapshot => {
      return docSnapshot.exists;
    })
    .catch(error => {
      console.error(error);
    });
  // depending on whether the task document exists, execute the appropriate logic
  doesTaskExist
    .then(exists => {
      console.log(`Task exists: ${exists}`);
      if (exists) {
        //task exists, compare and update document appropriately
      } else {
        //task document doesn't exist, add to tracked tasks
        console.log("Add document");
        var documentData = {
          is_archived: request.body.event_data.is_archived,
          content: request.body.event_data.content,
          due_date_utc: request.body.event_data.due_date_utc,
          priority: request.body.event_data.priority
        };
        return db
          .collection("users")
          .doc(userUid)
          .collection("trackedTasks")
          .doc(taskId)
          .set(documentData, { merge: true });
      }
      return exists;
    })
    .catch(error => {
      console.error(error);
    });
  // Check if the task exists already in the database
  response.status(200).send();
});
