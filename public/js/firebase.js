function signinFirebase() {
    // Initialize the FirebaseUI Widget using Firebase.
    // https://firebase.google.com/docs/auth/web/firebaseui
    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                // User successfully signed in.
                // Return type determines whether we continue the redirect automatically
                // or whether we leave that to developer to handle.
                return true;
            },
            uiShown: function() {
                // The widget is rendered, hide the loader button
                var signIn = document.getElementById('firebaseSignIn');
                if (signIn) signIn.style.display = 'none';
            }
        },
        // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
        signInFlow: 'popup',
        signInSuccessUrl: '#',
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
            //,firebase.auth.FacebookAuthProvider.PROVIDER_ID
            //,firebase.auth.TwitterAuthProvider.PROVIDER_ID
            //,firebase.auth.GithubAuthProvider.PROVIDER_ID
            ,firebase.auth.EmailAuthProvider.PROVIDER_ID
            //,firebase.auth.PhoneAuthProvider.PROVIDER_ID
        ],
        // Terms of service url.
        tosUrl: 'https://www.walkingtennis.org/adminterms.html',
        // Privacy policy url.
        privacyPolicyUrl: 'https://www.walkingtennis.org/adminprivacy.html'
    };

    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);	
};

function getFirebaseUser() {
    return firebase.auth().currentUser;
}

function getFirebaseUserData(user, onSuccess, onFailure) {
    // get the user data from firebase
    if (user && firebase) {
        // get the current UID and get the data in the store for this user
        var userUid = user.uid;
        var db = firebase.firestore();
        // get the data for the user
        const docRef = db.collection('users').doc(userUid)
        docRef.get().then(function(doc) {
            if (doc.exists) {
                // do stuff with the data
                onSuccess(doc.data());
            } else if (onFailure) {
                // deligate
                onFailure();
            }
            else {
                // doc.data() will be undefined in this case
                console.log("No such document: " + docRef);
            }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });
    }
    else {
        // no firebase
        return null;
    }
}

function checkDataExpiryDate(firebaseUserData, dataTitle) {
    if (firebaseUserData) {
        var date = firebaseUserData[dataTitle];
        if (date == null || date.toDate().getTime() > new Date().getTime()) {
            // there is no expiry, or it hasn't passed, this is active, we are good to go
            return true;
        }
        else {
            // the expiry date has passed
            return false;
        }
    }
    else {
        // no data
        console.log("trying to get if user data without any data")
        return false;
    }
}

function isFirebaseUserMember(firebaseUserData) {
    return checkDataExpiryDate(firebaseUserData, "expiry_member");
}

function isFirebaseUserCoach(firebaseUserData) {
    return checkDataExpiryDate(firebaseUserData, "expiry_coach");
}

function updateFirebaseUserItems(user) {
    // show the extra buttons when logging in changes
    if (user) {	
        getFirebaseUserData(user, function(userData) {
            // we have the data
            var coachingItems = document.getElementsByClassName("menu_coaching");
            var isCoach = isFirebaseUserCoach(userData);
            var i;
            for (i = 0; i < coachingItems.length; i++) {
                if (isCoach) {
                    coachingItems[i].style.display = null;
                }
                else {
                    coachingItems[i].style.display = 'none';
                }
            }
        },
        function() {
            // failed to get the data
            var coachingItems = document.getElementsByClassName("menu_coaching");
            var i;
            for (i = 0; i < coachingItems.length; i++) {
                coachingItems[i].style.display = 'none';
            }
        })
    }
    else {
        // not logged in
        var coachingItems = document.getElementsByClassName("menu_coaching");
        var i;
        for (i = 0; i < coachingItems.length; i++) {
            coachingItems[i].style.display = 'none';
        }
    }
}

function initialiseFirebaseLoginButton() {
    // setup the login button properly
    var signIn = document.getElementById('firebaseSignIn');
    var signedIn = document.getElementById('firebaseSignedIn');
    if (signIn && signedIn) {
        signIn.style.display = 'none';
        signedIn.style.display = 'none';
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                signIn.style.display = 'none';
                signedIn.style.display = null;
                signedIn.innerHTML  = '<a href="profile.html">' + user.displayName + '</a>';
                console.log('user ' + user.displayName + " logged in");
            } else {
                // No user is signed in.
                signIn.style.display = null;
                signedIn.style.display = 'none';
                console.log('no user logged in');
            }

            // update user role details
            updateFirebaseUserItems(user);

            // dispatch this change to the document
            document.dispatchEvent(new Event('firebaseuserchange'));
        });
        signIn.onclick = signinFirebase;
    }
};