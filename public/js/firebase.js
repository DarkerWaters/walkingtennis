function signinFirebase() {
    // Initialize the FirebaseUI Widget using Firebase.
    // https://firebase.google.com/docs/auth/web/firebaseui
    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                // signed in successfully, hide the box we used to select the type
                document.getElementById('firebase_login_container').style.display = "none";
                // and we can get the data here
                /*
                var user = authResult.user;
                var credential = authResult.credential;
                var isNewUser = authResult.additionalUserInfo.isNewUser;
                var providerId = authResult.additionalUserInfo.providerId;
                var operationType = authResult.operationType;
                // Do something with the returned AuthResult.
                */
                // Return type determines whether we continue the redirect automatically
                // or whether we leave that to developer to handle.
                return true;
            },
            signInFailure: function (error) {
                // Some unrecoverable error occurred during sign-in.
                document.getElementById('firebase_login_container').style.display = "none";
                // Return a promise when error handling is completed and FirebaseUI
                // will reset, clearing any UI. This commonly occurs for error code
                // 'firebaseui/anonymous-upgrade-merge-conflict' when merge conflict
                // occurs. Check below for more details on this.
                return handleUIError(error);
            },
            uiShown: function () {
                // The widget is rendered, hide the loader button
                var signIn = document.getElementById('firebaseSignIn');
                if (signIn) {
                    signIn.style.display = 'none';
                }
            }
        },
        credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,
        // Query parameter name for mode.
        queryParameterForWidgetMode: 'mode',
        // Query parameter name for sign in success url.
        queryParameterForSignInSuccessUrl: 'signInSuccessUrl',
        // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
        signInFlow: 'popup',
        signInSuccessUrl: '#',
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
            /*,firebase.auth.TwitterAuthProvider.PROVIDER_ID
            {
                provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                // Whether the display name should be displayed in the Sign Up page.
                requireDisplayName: true
            }*/
            /*,{
                provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                // Invisible reCAPTCHA with image challenge and bottom left badge.
                recaptchaParameters: {
                    type: 'image',
                    size: 'invisible',
                    badge: 'bottomleft'
                }
            }*/
            //,firebase.auth.FacebookAuthProvider.PROVIDER_ID
            //,firebase.auth.GithubAuthProvider.PROVIDER_ID
            ,firebase.auth.EmailAuthProvider.PROVIDER_ID
        ],
        // tosUrl and privacyPolicyUrl accept either url string or a callback
        // function.
        // Terms of service url.
        tosUrl: 'https://www.walkingtennis.org/adminterms.html',
        // Privacy policy url.
        privacyPolicyUrl: 'https://www.walkingtennis.org/adminprivacy.html'
    };

    // show the container to login with
    document.getElementById('firebase_login_container').style.display = null;

    // Initialize the FirebaseUI Widget using Firebase.
    if(firebaseui.auth.AuthUI.getInstance()) {
        const ui = firebaseui.auth.AuthUI.getInstance();
        ui.start('#firebase_login_container', uiConfig);
    } else {
        const ui = new firebaseui.auth.AuthUI(firebase.auth());
        ui.start('#firebase_login_container', uiConfig);	
    }
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

function updateFirebaseUserDisplay(user) {
    // update the dispay according the user being logged on or not
    var signIn = document.getElementById('firebaseSignIn');
    var signedIn = document.getElementById('firebaseSignedIn');
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
}

function initialiseFirebaseLoginButton() {
    // setup the login button properly
    var signIn = document.getElementById('firebaseSignIn');
    var signedIn = document.getElementById('firebaseSignedIn');
    if (signIn && signedIn) {
        signIn.style.display = 'none';
        signedIn.style.display = 'none';
        firebase.auth().onAuthStateChanged(function(user) {
            // update the display of the user here
            updateFirebaseUserDisplay(user);
        });
        signIn.onclick = signinFirebase;
    }
};