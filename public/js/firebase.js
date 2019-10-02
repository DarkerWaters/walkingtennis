
function initialiseFirebaseLoginButton() {

    var signIn = document.getElementById('firebaseSignIn');
    var signedIn = document.getElementById('firebaseSignedIn');
    if (signIn && signedIn) {
        signIn.style.display = 'none';
        signedIn.style.display = 'none';
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                signIn.style.display = 'none';
                signedIn.style.display = 'block';
                signedIn.innerHTML  = user.displayName;
                console.log('user ' + user.displayName + " logged in");
            } else {
                // No user is signed in.
                signIn.style.display = 'block';
                signedIn.style.display = 'none';
                console.log('no user logged in');
            }
        });
    }
};

function signinFirebase() {
    // Initialize the FirebaseUI Widget using Firebase.
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
        signInSuccessUrl: '<url-to-redirect-to-on-success>',
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            firebase.auth.GithubAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
            firebase.auth.PhoneAuthProvider.PROVIDER_ID
        ],
        // Terms of service url.
        tosUrl: '<your-tos-url>',
        // Privacy policy url.
        privacyPolicyUrl: '<your-privacy-policy-url>'
    };

    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);	
};