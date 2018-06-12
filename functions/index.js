'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Modify FCM Groups when collection changes
 */
exports.notifyEvents = functions.firestore.document('users/{vipUid}/events/{eventId}')
    .onWrite((change, context) => {
      const vipUid = context.params.vipUid;
      const eventId = context.params.eventId;
      
      // If un-follow we exit the function.
      if (change.before.exists) {
        console.log('Change before: '+JSON.stringify(change.before.data()));
      }
      if (change.after.exists) {
        console.log('Change after: '+JSON.stringify(change.after.data()));
      }

      // Get the list of device notification tokens.
      return admin.firestore().doc(`/groups/${vipUid}`).get().then(doc => {
        
        if (doc.exists) {
            console.log('doc: '+JSON.stringify(doc.data()));
            const tokensSnapshot = doc.data().guards;

            // Notification details.
            const payload = {
                data: {
                    type: String(change.after.data().type),
                    title: change.after.data().title,
                    body: change.after.data().body
                    //date: change.after.data().date
                    //sound: "default"
                }
            };

            // Listing all tokens as an array.
            const tokens = Object.keys(tokensSnapshot).map(function(key) {
                return tokensSnapshot[key];
            });
            console.log('Tokens:', tokens);
            // Send notifications to all tokens.
            admin.messaging().sendToDevice(tokens, payload)
            .then(function(response) {
                // See the MessagingDevicesResponse reference documentation for
                // the contents of response.
                console.log('Successfully sent message:', JSON.stringify(response));
              })
              .catch(function(error) {
                console.log('Error sending message:', error);
              });
        }
      }).catch(err => {
        console.log('Error getting document', err);
      });
    });