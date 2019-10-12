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
    window.location = 'index.html';
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
            // we have the user data here, set the data correctly
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

            // to be sure we have an up-to-date picture of our user, let's update their name and email here if wrong...
            if (data['name'] !== user.displayName || data['email' !== user.email]) {
                // update our data held about them here
                const docRef = firebase.firestore().collection('users').doc(user.uid)
                docRef.update({
                    name: user.displayName,
                    email: user.email
                }).catch(function(error) {
                    console.log("Error updating user information held against them", error);
                });
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

    getUserProfiles();
};

function deleteMembershipCountdown() {
    var countdownDiv = document.getElementById('delete_button_countdown');
    var deleteButton = document.getElementById('delete_membership_button');
    var seconds = 4;
    countdownDiv.innerHTML = 'Pausing just a little for you to reconsider...'
    // Count down from 5 to show the button
    let timerId = setInterval(() => countdownDiv.innerHTML = seconds--, 1000);

    // after 5 seconds stop
    setTimeout(() => { clearInterval(timerId); countdownDiv.style.display = 'none'; deleteButton.style.display = null; }, 5000);
}

function deleteMembership() {
    // okay, let's delete the membership data here
    var user = getFirebaseUser();
    if (!user) {
        // they don't seem to be logged in
        alert("Sorry about this, but you don't seem to be logged in properly, try refreshing the page and starting again." );
    }
    else if (confirm("Last chance, are you sure you want to delete everything?")) {
        firebase.firestore().collection("users").doc(user.uid).delete().then(function() {
            logout();
        }).catch(function(error) {
            alert("Sorry about this, but there was some error in removing all your data, please contact us to confirm all you data was in-fact removed. Please reference this weird set of letters to help us find it: '" + user.uid + "'." );
            console.error("Error removing document: ", error);
        });
    }
}

function enablePasswordChange() {
    // hide the change button
    document.getElementById('change_password_button').style.display = 'none';
    // show the password controls
    document.getElementById('change_password_container').style.display = null;
}

function resetPassword() {
    // check the password values
    var passwordOneControl = document.getElementById('password_one');
    var passwordTwoControl = document.getElementById('password_two');
    var user = getFirebaseUser();
    if (user && passwordOneControl.value === passwordTwoControl.value) {
        // this is the new password
        user.updatePassword(passwordOneControl.value).then(function () {
            // Update successful.
            document.getElementById('change_password_button').style.display = null;
            document.getElementById('change_password_container').style.display = 'none';
        }).catch(function (error) {
            // An error happened.
            alert(error);
        });
    }
    else {
        alert('passwords have to match...');
    }
}

function enableEdit() {
    var nameEdit = document.getElementById('name');
    var emailEdit = document.getElementById('email');

    // stop the entry fields from being readonly
    nameEdit.removeAttribute('readonly');
    emailEdit.removeAttribute('readonly');

    // hide the change button
    document.getElementById('edit_profile_button').style.display = 'none';
    // and show the editing buttons
    document.getElementById('edit_profile_commit_button').style.display = null;
    document.getElementById('edit_profile_discard_button').style.display = null;
}

function saveEdits() {
    // save the changes in the values to the profile
    var user = getFirebaseUser();
    var newName = document.getElementById('name').value;
    var newEmail = document.getElementById('email').value;

    // hide the editing buttons
    document.getElementById('edit_profile_commit_button').style.display = 'none';
    document.getElementById('edit_profile_discard_button').style.display = 'none';
    // and show the edit button
    document.getElementById('edit_profile_button').style.display = null;

    // update the data in the profile
    if (user != null) {
        if (user.displayName !== newName) {
            user.updateProfile({
                displayName: newName
            }).then(function () {
                // Update successful
                populateUserData();
                location.reload();
            }).catch(function (error) {
                // An error happened.
                console.log('failed to change the profile data for some reason', error);
                populateUserData();
            });
        }
        if (newEmail !== user.email) {
            // need to update the email too
            user.updateEmail(newEmail).then(function () {
                // Update successful.
                populateUserData();
                location.reload();
            }).catch(function (error) {
                // An error happened.
                console.log('failed to change the email for some reason', error);
                alert(error);
                populateUserData();
            });
        }
    }
}

function discardEdits() {
    // throw out the changes in the values to the profile
    document.getElementById('edit_profile_commit_button').style.display = 'none';
    document.getElementById('edit_profile_discard_button').style.display = 'none';
    // and show the edit button
    document.getElementById('edit_profile_button').style.display = null;
    // put the old data back
    populateUserData();
}

function getUserProfiles() {
    var user = getFirebaseUser();
    if (user != null) {
        user.providerData.forEach(function (profile) {
            console.log("Sign-in provider: " + profile.providerId);
            console.log("  Provider-specific UID: " + profile.uid);
            console.log("  Name: " + profile.displayName);
            console.log("  Email: " + profile.email);
            console.log("  Photo URL: " + profile.photoURL);
        });
    }
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});