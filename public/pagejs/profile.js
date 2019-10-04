// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page
function showMembershipChange() {
    document.getElementById('change_membership').style.display = null;
    document.getElementById('membership_button').style.display = 'none';
};
function sendEmailVerfication() {
    var user = firebase.auth().currentUser;
    if (user) {
        user.sendEmailVerification().then(function() {
            // Email sent.
            alert('email sent to ' + user.email);
        }).catch(function(error) {
            // An error happened.
            console.log(error);
        });
    }
    populateUserData();
}
function logout() {
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
    }).catch(function(error) {
        // An error happened.
        console.log(error);
    });
    populateUserData();
}
function populateUserData() {
    var user = getFirebaseUser();
    if (user) {
        // populate the form
        document.getElementById('profile_data').style.display = null;
        document.getElementById('name').value = user.displayName;
        document.getElementById('email').value = user.email;
        document.getElementById('email-verified').checked = user.emailVerified;
        document.getElementById('user_image').src = user.photoURL;
        document.getElementById('membership-member').checked = true;
        document.getElementById('membership-coach').checked = false;
        document.getElementById('membership-coach-expiry-input').style.display = 'none';

        // hide the email verification button if verified already
        if (user.emailVerified) {
            document.getElementById('send_verification').style.display = 'none';
        }
        else {
            document.getElementById('send_verification').style.display = null;
        }
        // get the user data from firebase here
        getFirebaseUserData(user, function(data) {
            // we have the user data here, set the data correcly
            document.getElementById('name').value = data['name'];
            document.getElementById('email').value = data['email'];
            var date = data['expiry_member'];
            if (date == null || date.toDate().getTime() > new Date().getTime()) {
                // there is no expiry, or it hasn't passed, this is active, we are a member
                document.getElementById('membership-coach').checked = true;
            }
            else {
                // the expiry date has passed
                document.getElementById('membership-coach').checked = false;
            }
            
            date = data['expiry_coach'];
            if (date == null || date.toDate().getTime() > new Date().getTime()) {
                // there is no expiry, or it hasn't passed, this is active, we are a coach
                document.getElementById('membership-coach').checked = true;
                if (date == null) {
                    // lasts forever
                    document.getElementById('membership-coach-expiry').value = "never";
                }
                else {
                    // else there is an expiry date
                    document.getElementById('membership-coach-expiry').value = date.toDate().toLocaleDateString();
                }
                // and show it
                document.getElementById('membership-coach-expiry-input').style.display = 'inline';
            }
            else {
                // the expiry date has passed
                document.getElementById('membership-coach').checked = false;
                document.getElementById('membership-coach-expiry-input').style.display = 'none';
            }
        }, function() {
            // this is the failure to get the data, do our best I suppose
            console.log("Failed to get the firestore user data for " + user);
        });
    }
    else {
        // hide the form
        document.getElementById('profile_data').style.display = 'none';
    }
};

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});