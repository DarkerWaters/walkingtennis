// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function searchUserNames() {
    var container = document.getElementById('found_user_container');
    var name = document.getElementById('name').value;
    container.innerHTML = "Searching for users with the name of '" + name + "'.";

    firebase.firestore().collection('users').where("name_lc", "==", name.toLowerCase()).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any users with the name of '" + name + "'.";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the name of '" + name + "': " + error;
            return 0;
        });
}

function searchUserEmails() {
    var container = document.getElementById('found_user_container');
    var email = document.getElementById('email').value;
    container.innerHTML = "Searching for users with the email address of '" + email + "'.";

    firebase.firestore().collection('users').where("email_lc", "==", email.toLowerCase()).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any users with the email address of '" + email + "'.";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the email address of '" + email + "': " + error;
            return 0;
        });
}

function getAllAdministrator() {
    var container = document.getElementById('found_user_container');
    container.innerHTML = "Searching for add administrators.";

    firebase.firestore().collection('users').where("isAdmin", "==", true).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any 'isAdmin==true' users";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the 'isAdmin' to be true: " + error;
            return 0;
        });
}

function onChangeUserAdminState(sourceId) {
    var user = firebaseData.getUser();
    var isAdminCheck = document.getElementById(sourceId + '_user_isAdmin');
    if (isAdminCheck.checked && user && user.uid == sourceId) {
        if (!confirm("You are about to turn off admin rights for yourself, this will make any further changes impossible, are you sure?")) {
            return 0;
        }
    }
    // the source Id is the UID of the user (the first half anyway), change this data
    var docRef = '/users/' + sourceId;
    firebase.firestore().doc(docRef)
        .update({
            isAdmin: (!isAdminCheck.checked)
        })
        .then(function() {
            // this worked
            isAdminCheck.checked = !isAdminCheck.checked;
        })
        .catch(function(error) {
            console.log("Failed to change the admin flag of the user", error);
            var messageSpan = document.getElementById(sourceId + '_user_message');
            if (messageSpan) {
                messageSpan.innerHTML = "Failed to change: " + error;
            }
        });
}

function splitId(elementToSplit) {
    var idString = elementToSplit.id;
    var index = idString.lastIndexOf('_');
    return [idString.substring(0, index), idString.substring(index + 1, idString.length)];
}

function displayUserData(container, doc) {
    var userDiv = document.getElementById('user_template').cloneNode(true);
    container.appendChild(userDiv);
    // set the id of this
    userDiv.id = doc.id;
    // and get the children we want to use
    var nameEdit = userDiv.querySelector('#user_name');
    var uidEdit = userDiv.querySelector('#user_uid');
    var emailEdit = userDiv.querySelector('#user_email');
    var isAdminCheck = userDiv.querySelector('#user_isAdmin');
    var messageSpan = userDiv.querySelector('#user_message');
    
    // to avoid duplicates, we want our own IDs here
    nameEdit.id = doc.id + '_' + nameEdit.id;
    uidEdit.id = doc.id + '_' + uidEdit.id;
    emailEdit.id = doc.id + '_' + emailEdit.id;
    isAdminCheck.id = doc.id + '_' + isAdminCheck.id;
    messageSpan.id = doc.id + '_' + messageSpan.id;
    userDiv.querySelector('#user_isAdmin_label').setAttribute("onclick", "onChangeUserAdminState('" + doc.id + "')");

    // get the data and populate the fields
    var data = doc.data();
    uidEdit.value = doc.id;
    nameEdit.value = data.name;
    emailEdit.value = data.email;
    isAdminCheck.checked = data.isAdmin == true;
    messageSpan.innerHTML = "";
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
});