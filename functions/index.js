// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const fieldValue = require('firebase-admin').firestore.FieldValue;

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

// when a user is created / first sign on, then we want to create the user entry to track their subscriptions etc
exports.createUserData = functions.auth.user().onCreate((user) => {
    // create the skeleton of user data
    const docRef = db.collection('users').doc(user.uid);
    
    docRef.set({
        // setup the blank user data here
        name: user.displayName,
        email: user.email,
        isAdmin: false,
        joined_date: fieldValue.serverTimestamp(),
        expiry_coach: fieldValue.serverTimestamp(),
        expiry_member: null

    });

});

// when a user is deleted, they are leaving, then we want to say goodbye and also to delete all their stored user data
exports.deleteUserData = functions.auth.user().onDelete((user) => {
    // delete all their data, to comply with GDPR
    //TODO delete all User data associated with the user UID
    const userUid = user.uid;

    //TODO also maybe send an email

    //TODO also maybe track that they left, if they were barred - remember this?
});
