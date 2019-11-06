// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const fieldValue = require('firebase-admin').firestore.FieldValue;

// let's use some email (terminal command to install was: "npm install nodemailer cors")
const cors = require('cors')({origin: true});
const nodemailer = require('nodemailer');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// and get the firestore database to write / read data etc
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/**
* Here we're using Gmail to send 
*/
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'info@walkingtennis.org',
        pass: '#WTBr15tol!'
    }
});

// when a user is created / first sign on, then we want to create the user entry to track their subscriptions etc
exports.createUserData = functions.auth.user().onCreate((user) => {
    // create the skeleton of user data
    var newUserData = {
        // setup the blank user data here
        name: user.displayName,
        name_lc: user.displayName.toLowerCase(),
        email: user.email,
        email_lc: user.email.toLowerCase(),
        isAdmin: false,
        lcount_permitted: 5,
        lpromotions_permitted: 0,
        isRxEmailFromWkta: true,
        isRxEmailFromPlayers: true,
        isRxEmailFromPartners: true,
        joined_date: fieldValue.serverTimestamp(),
        expiry_coach: fieldValue.serverTimestamp(),
        expiry_member: null
    };
    db.collection('users').doc(user.uid).set(newUserData, {merge: true})
        .then(function() {
            // this worked
            console.log('added user data', user);
            return 0;
        })
        .catch(function(error) {
            // failed
            console.log("failed to create the user data", error);
        });
    return 0;
});

// when a user is deleted, they are leaving, then we want to say goodbye and also to delete all their stored user data
exports.deleteUserData = functions.auth.user().onDelete((user) => {
    // delete all their data, to comply with GDPR
    
    // they may have shared some locations, delete all these
    firebase.firestore().collection('locations').where("user_uid", "==", user.uid).get()
        .then(function(querySnapshot) {
            // this worked, delete them all
            querySnapshot.forEach(function (doc) {
                // for each document, delete the document
                firebase.firestore().collection('locations').doc(doc.id).delete()
                    .then(function() {
                        // this worked
                        console.log('deleted user location data for ' + user.uid, doc);
                        return 0;
                    })
                    .catch(function(error) {
                        // this didn't work
                        console.log('failed to delete a location document on user delete', error);
                    });
            });
            return 0;
        })
        .catch(function(error) {
            // this didn't work
            console.log('failed to get the location documents to delete them', error);
        });

    // lastly - delete their user data
    db.collection('users').doc(user.uid).delete()
        .then(function() {
            // this worked
            console.log('deleted user data', user);
            return 0;
        })
        .catch(function(error) {
            // this didn't work
            console.log('failed to delete a the user data', error);
        });

    
    //TODO also maybe send an email

    //TODO also maybe track that they left, if they were barred - remember this?
    
    // and return
    return 1;
});

// when a user's data is changed, assign the proper role (admin, based on the 'isAdmin' flag in the data)
exports.updateAdminRole = functions.firestore
    .document('users/{userId}')
    .onUpdate((change, context) => {
        var data = change.after.data();
        var result = 0;
        if (data.isAdmin !== change.before.data().isAdmin) {
            // there was a change to the 'isAdmin' value
            if (data.isAdmin) {
                // changed to admin user, update the role for this user
                admin.auth().setCustomUserClaims(context.params.userId, {admin: true});
                result = 1;          
            }
            else {
                // change to not be admin user, remove this role from the user
                admin.auth().setCustomUserClaims(context.params.userId, {admin: false});
                result = 2;
            }
        }
        // return the result of this (0 if done nothing)
        return result;
    });

// when someone posts a message to the admin place, send us an email to tell us
exports.forwardAdminMessage = functions.firestore
    .document('admin_messages/{messageId}')
    .onWrite((change, context) => {
        // If we set `/users/marie` to {name: "Marie"} then
        // context.params.userId == "marie"
        // ... and ...
        // change.after.data() == {name: "Marie"}
        var data = change.after.data();
        const mailOptions = {
            from: 'WalkingTennisSite <' + data.from_email + '>', // Something like: Jane Doe <janedoe@gmail.com>
            to: 'info@walkingtennis.org',
            subject: 'Redirected message from the website', // email subject
            html: 'From: ' + data.from + 
                  '<br>' + data.from_name +
                  '<br>' + data.from_email +
                  '<br>' + data.last_update +
                  '<br><br>' + data.message
        };
  
        // returning result
        transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                console.log('sending email error: ' + error);
                return 1
            }
            return 0
        });
        // return the result of this
        return 0;

        /*cors(req, res, () => {
            // getting dest email by query string
            const dest = req.query.dest;
    
            const mailOptions = {
                from: 'Your Account Name <yourgmailaccount@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
                to: dest,
                subject: 'I\'M A PICKLE!!!', // email subject
                html: `<p style="font-size: 16px;">Pickle Riiiiiiiiiiiiiiiick!!</p>
                    <br />
                    <img src="https://images.prod.meredith.com/product/fc8754735c8a9b4aebb786278e7265a5/1538025388228/l/rick-and-morty-pickle-rick-sticker" />
                ` // email content in HTML
            };
      
            // returning result
            return transporter.sendMail(mailOptions, (erro, info) => {
                if(erro){
                    return res.send(erro.toString());
                }
                return res.send('Sended');
            });
        });   
        // return the result of this (0 if done nothing)
        return result;
        */
    });
