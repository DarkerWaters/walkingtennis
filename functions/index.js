'use strict';

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const fieldValue = require('firebase-admin').firestore.FieldValue;

// let's use some email (terminal command to install was: "npm install nodemailer cors")
/*const cors = require('cors')({origin: true});
const nodemailer = require('nodemailer');*/

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

const stripe = require('stripe')(functions.config().stripe.token);
const currency = functions.config().stripe.currency || 'USD';

// will need to deploy the string API_KEY with the CLI command
//firebase functions:config:set stripe.token="sk_test_6fYvLRIXvNvB2BeQVoj92JFw00ItMQ8Fm6"

/**
* Here we're using Gmail to send 

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secureConnection: true,
    port: 465,
    transportMethod: 'SMTP',
    auth: {
        user: 'info@walkingtennis.org',
        pass: 'exmifxcoieuebqbi'
    },
    tls: {
        rejectUnauthorized: false
    }
});
*/

function lcRef (str) {
    if (!str) {
        return str;
    }
    else {
        // remove all spaces and make it lowercase
        str = str.toLowerCase().replace(/\s/g,'');
        // and get rid of anything too weird
        str = str.replace(/\W/g, '');
        if (str.length > 1 && str.slice(-1) === 's') {
            // remove any trailing 's' characters
            str = str.slice(0, -1);
        }
        return str;
    }
}

// when a user is created / first sign on, then we want to create the user entry to track their subscriptions etc
exports.createUserData = functions.auth.user().onCreate(async (user) => {
    // need a stripe customer ID for every user
    const customer = await stripe.customers.create({email: user.email});
    // create the skeleton of user data to include this, and all the default data needed
    var newUserData = {
        // setup the blank user data here
        name: user.displayName,
        name_lc: lcRef(user.displayName),
        customer_id: customer.id,
        email: user.email,
        email_lc: lcRef(user.email),
        isAdmin: false,
        lcount_permitted: 1,
        lpromotions_permitted: 0,
        isRxEmailFromWkta: true,
        isRxEmailFromPlayers: true,
        isRxEmailFromPartners: true,
        joined_date: fieldValue.serverTimestamp(),
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
exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
    // delete all their data, to comply with GDPR, delete their stripe account from here
    const snapshot = await db.collection('users').doc(user.uid).get();
    if (snapshot) {
        const customer = snapshot.data();
        if (customer && customer.customer_id) {
            // delete the stripe customers ID we stored
            await stripe.customers.del(customer.customer_id);
        }
        else {
            console.log('deleting user without a stripe customer_id to delete');
        }
    }
    
    // they may have shared some locations, delete all these
    db.collection('locations').where("user_uid", "==", user.uid).get()
        .then(function(querySnapshot) {
            // this worked, delete them all
            querySnapshot.forEach(function (doc) {
                // for each document, delete the document
                db.collection('locations').doc(doc.id).delete()
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

/*

// when someone posts a message to the admin place, send us an email to tell us
exports.forwardAdminMessage = functions.firestore
    .document('admin_messages/{messageId}')
    .onWrite((change, context) => {
        // If we set `/users/marie` to {name: "Marie"} then
        // context.params.userId == "marie"
        // ... and ...
        // change.after.data() == {name: "Marie"}
        var data = change.after.data();
        if (data) {
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
        }
        else {
            // return that no data was found
            return 1;
        }
    });
*/

// [START chargecustomer]
// Charge the Stripe customer whenever an amount is created in Cloud Firestore
exports.createStripeCharge = functions.firestore.document('users/{userId}/stripe_charges/{id}').onCreate(async (snap, context) => {
    const val = snap.data();
    try {
        // Look up the Stripe customer id written in createStripeCustomer
        const snapshot = await admin.firestore().collection(`users`).doc(context.params.userId).get()
        const snapval = snapshot.data();
        const customer = snapval.customer_id
        // Create a charge using the pushId as the idempotency key
        // protecting against double charges
        const amount = val.amount;
        const idempotencyKey = context.params.id;
        const charge = {
            amount,
            currency,
            customer
        };
        if (val.source !== null) {
            charge.source = val.source;
        }
        const response = await stripe.charges.create(charge, {
            idempotency_key: idempotencyKey
        });
        // If the result is successful, write it back to the database
        return snap.ref.set(response, {
            merge: true
        });
    } catch (error) {
        // We want to capture errors and render them in a user-friendly way, while
        // still logging an exception with StackDriver
        console.log(error);
        return 1;
    }
});
// [END chargecustomer]]

// Add a payment source (card) for a user by writing a stripe payment source token to Cloud Firestore
exports.addPaymentSource = functions.firestore.document('/users/{userId}/stripe_tokens/{pushId}').onCreate(async (snap, context) => {
    const source = snap.data();
    const token = source.token;
    if (source === null) {
        return null;
    }

    try {
        const snapshot = await admin.firestore().collection('users').doc(context.params.userId).get();
        const customer = snapshot.data().customer_id;
        const response = await stripe.customers.createSource(customer, {
            source: token
        });
        return admin.firestore().collection('users').doc(context.params.userId).collection("stripe_sources").doc(response.fingerprint).set(response, {
            merge: true
        });
    } catch (error) {
        console.log("error adding a payment source: ", error);
        return 1;
    }
});
