// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

var isChangedShareLocations = false;
var permittedLocationShareCount = 0;
var locationSharesDeleted = [];

function showMembershipChange() {
    document.getElementById('change_membership').style.display = null;
    document.getElementById('membership_button').style.display = 'none';
};

function sendEmailVerfication() {
    var user = firebaseData.getUser();
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

function setFirebaseUserLocation(user, latitude, longitude, onSuccess, onFailure) {
    // clear the contents of the map
    var locationsRef = firebase.firestore().collection("locations");
    var usersUpdate = {};
    usersUpdate['user_uid'] = user.uid;
    usersUpdate['user_name'] = user.displayName;
    usersUpdate['home_location'] = new firebase.firestore.GeoPoint(latitude, longitude);
    usersUpdate['geohash'] = encodeGeohash([latitude, longitude]);

    locationsRef.where("user_uid", "==", user.uid)
    .get()
    .then(function(querySnapshot) {
        if (querySnapshot.empty) {
            // this user has not yet published their location - publish now
            locationsRef.add(usersUpdate)
            .then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch(function(error) {
                console.error("Error adding document: ", error);
            });
        }
        else {
            querySnapshot.forEach(function(doc) {
                console.log(doc.id, " => ", doc.data());
                doc.ref.update(usersUpdate).then(function() {
                    console.log("Successfully updated the user's published location")
                    onSuccess();
                })
                .catch(function(error) {
                    console.log("Error updating document: ", error);
                    onFailure();
                });
            });
        }
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
        
    });
}

function ensureUpToDateUserData(user, data) {
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
}

function displayMembershipData(data) {
    var date = data['expiry_member'];
    if (date == null || date.toDate().getTime() > new Date().getTime()) {
        // there is no expiry, or it hasn't passed, this is active, we are a member
        document.getElementById('membership-member').checked = true;
    }
    else {
        // the expiry date has passed
        document.getElementById('membership-member').checked = false;
    }
    permittedLocationShareCount = data['lcount_permitted'];
    if (!permittedLocationShareCount) {
        document.getElementById('lcount_permitted').innerHTML = "infinite";
    }
    else {
        document.getElementById('lcount_permitted').innerHTML = permittedLocationShareCount;
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
}

function displayCommunicationOptions(data) {
    // set the communication options from the data
    // WtTA is special - have to turn off explicitly
    var isOff = data['isRxEmailFromWkta'] && data['isRxEmailFromWkta'] === false;
    document.getElementById('isRx-emailFromWkta').checked = !isOff;
    // the others are on if explicitly turned on
    document.getElementById('isRx-emailFromPlayers').checked = data['isRxEmailFromPlayers'];
    document.getElementById('isRx-emailFromPartners').checked = data['isRxEmailFromPartners'];
    document.getElementById('is_share_location').checked = data['isShareLocations'];
    
    // update the display of any shared locations
    displayShareLocationTableData();
}

function populateUserData() {
    var user = firebaseData.getUser();
    if (user) {
        // populate the form, defaulting everything we don't know yet
        document.getElementById('profile_data').style.display = null;
        document.getElementById('name').value = user.displayName;
        document.getElementById('email').value = user.email;
        document.getElementById('email-verified').checked = user.emailVerified;
        document.getElementById('user_image').src = user.photoURL;
        document.getElementById('membership-member').checked = true;
        document.getElementById('membership-coach').checked = false;
        document.getElementById('membership-coach-expiry-input').style.display = 'none';
        document.getElementById('lcount_permitted').innerHTML = "5";
        document.getElementById('is_share_location').checked = false;

        // hide the email verification button if verified already
        if (user.emailVerified) {
            document.getElementById('send_verification').style.display = 'none';
        }
        else {
            document.getElementById('send_verification').style.display = null;
        }
        // get the user data from firebase here
        firebaseData.getUserData(user, 
            function(data) {
                // we have the user data here, set the data correctly
                displayMembershipData(data);

                displayCommunicationOptions(data);

                // be sure to update our map of their name and email etc that we keep a copy of
                ensureUpToDateUserData(user, data);

            }, function(error) {
                // this is the failure to get the data, do our best I suppose
                console.log("Failed to get the firestore user data for " + user + ":", error);
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
    var user = firebaseData.getUser();
    if (!user) {
        // they don't seem to be logged in
        alert("Sorry about this, but you don't seem to be logged in properly, try refreshing the page and starting again." );
    }
    else if (confirm("Last chance, are you sure you want to delete everything?")) {
        // delete all the location shares they have published
        firebaseData.deleteAllUserData(user,
            function() {
                // cool, deleted all the user data
                logout();
            },
            function(error) {
                // oops
                alert("Sorry about this, but there was some error in removing all your data, please contact us to confirm all you data was in-fact removed. Please reference this weird set of letters to help us find it: '" + user.uid + "'." );
                console.error("Error deleting location shared: ", error);
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
    var user = firebaseData.getUser();
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
    var user = firebaseData.getUser();
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
        // if they changed the location, update the location to what they set
        if (isChangedLocation) {
            setFirebaseUserLocation(user, 51.4545, -2.5879, function() {
                // this change was successful
                populateUserData();
                location.reload();
            }, function() {
                // this change was not successful
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
    var user = firebaseData.getUser();
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

function setShareLocationFlag(isChanged) {
    isChangedShareLocations = isChanged;
    if (isChangedShareLocations) {
        document.getElementById('edit_share_location_commit_button').classList.add('special');
    }
    else {
        document.getElementById('edit_share_location_commit_button').classList.remove('special');
    }
}

function onClickShareLocation() {
    // they want to share / unshare their location - the checkbox state has changed
    displayShareLocationTableData();
    setShareLocationFlag(true);
}

function onClickDeleteSharedLocation(source) {
    // find the child that is the row in the table
    var tableElement = document.getElementById('location_share_table');
    var tableRow = source;
    while (tableRow && tableRow.parentElement !== tableElement.tBodies[0]) {
        tableRow = tableRow.parentElement;
    }
    if (tableRow) {
        // have the row, is this a document that we loaded (if so then we need to remember to delete it)
        if (tableRow.id !== 'new') {
            locationSharesDeleted.push(tableRow.id);
        }
        // remove the row visually
        tableElement.tBodies[0].removeChild(tableRow);
        setShareLocationFlag(true);
    }
}

function onClickEmailFromPlayers() {
    // as they change their preference, update the user account details for this data
    var user = firebaseData.getUser();
    if (user) {
        var usersUpdate = {};
        usersUpdate['isRxEmailFromPlayers'] = document.getElementById('isRx-emailFromPlayers').checked;
        // and send this update
        firebaseData.updateUserData(user, usersUpdate, 
            function() {
                // this worked
            },
            function(error) {
                // this failed
                console.error("Error updating communication preference: ", error);
            });
    }
}

function onClickEmailFromPartners() {
    // as they change their preference, update the user account details for this data
    var user = firebaseData.getUser();
    if (user) {
        var usersUpdate = {};
        usersUpdate['isRxEmailFromPartners'] = document.getElementById('isRx-emailFromPartners').checked;
        // and send this update
        firebaseData.updateUserData(user, usersUpdate, 
            function() {
                // this worked
            },
            function(error) {
                // this failed
                console.error("Error updating communication preference: ", error);
            });
    }
}

function saveLocationShareEdits() {
    var tableElement = document.getElementById('location_share_table');
    var user = firebaseData.getUser();
    if (user) {
        // as they change their preference, update the user account details for this data
        var user = firebaseData.getUser();
        if (user) {
            var usersUpdate = {};
            usersUpdate['isShareLocations'] = document.getElementById('is_share_location').checked;
            // and send this update
            firebaseData.updateUserData(user, usersUpdate, 
                function() {
                    // this worked
                },
                function(error) {
                    // this failed
                    console.error("Error updating communication preference: ", error);
                });
        }
        // delete all the documents deleted
        for (var i = 0; i < locationSharesDeleted.length; ++i) {
            firebaseData.deleteUserShareLocation(locationSharesDeleted[i], 
                function() {
                    // this worked
                    console.log('deleted location document');
                },
                function(error) {
                    // this didn't
                    console.log("Failed to delete the old location data", error);
                });
        }
        // clear the list of deleted
        locationSharesDeleted = [];
        if (document.getElementById('is_share_location').checked) {
            // save all the edits to locations we have made, get all the rows - each row is a shared location
            for (var i = 0; i < tableElement.tBodies[0].children.length; ++i) {
                var tableRow = tableElement.tBodies[0].children[i];
                // create this row as some data
                var locationData = {};
                locationData['reference'] = tableRow.querySelector('#location_share_ref').value;
                locationData['user_name'] = tableRow.querySelector('#location_share_name').value;
                locationData['user_email'] = tableRow.querySelector('#location_share_email').value;
                locationData['user_uid'] = user.uid;
                // get the raw lat and lon to create the location from
                var latitude = Number(tableRow.querySelector('#location_share_lat').value);
                var longitude = Number(tableRow.querySelector('#location_share_lon').value);
                // create both types of location here
                locationData['location'] = new firebase.firestore.GeoPoint(latitude, longitude);
                locationData['geohash'] = encodeGeohash([latitude, longitude]);
                
                if (tableRow.id === 'new') {
                    // this is a new one, create this new document
                    firebaseData.addUserShareLocation(locationData,
                        function(newDocRef) {
                            // this worked great, set the ID of this row
                            tableRow.id = newDocRef.id;
                            setShareLocationFlag(false);
                        },
                        function(error) {
                            // oops
                            console.log("Failed to set the new location data", error);
                        })

                }
                else {
                    // this is an existing location, update its data here
                    firebaseData.setUserShareLocation(tableRow.id, locationData, 
                        function() {
                            // this worked
                            setShareLocationFlag(false);
                        },
                        function(error) {
                            // this didn't
                            console.log("Failed to set the new location data", error);
                        });
                }
            }
        }
        else {
            // the sharing is off, delete all the locations here
            firebaseData.deleteUserShareLocations(user, 
                function() {
                    // yey - clear all the rows
                    document.getElementById('location_share_table').tBodies[0].innerHTML = "";
                },
                function(error) {
                    console.log('failed to delete the user share locations', error);
                });
        }
    }
}

function onClickAddSharedLocation() {
    // they want another location, can we?
    var tableElement = document.getElementById('location_share_table');

    if (!permittedLocationShareCount || permittedLocationShareCount > tableElement.tBodies[0].children.length) {
        // we can add another, add it here
        var rowTemplate = document.getElementById('location_share_location_template_row');
        var newRow = rowTemplate.cloneNode(true);
        // set the ID of this new row
        newRow.id = 'new';
        // listen to changes on this row
        var refElement = newRow.querySelector('#location_share_ref');
        var nameElement = newRow.querySelector('#location_share_name');
        var emailElement = newRow.querySelector('#location_share_email');
        var latElement = newRow.querySelector('#location_share_lat');
        var lonElement = newRow.querySelector('#location_share_lon');
        
        listenForChange(refElement, function() {setShareLocationFlag(true)});
        listenForChange(nameElement, function() {setShareLocationFlag(true)});
        listenForChange(emailElement, function() {setShareLocationFlag(true)});
        listenForChange(latElement, function() {setShareLocationFlag(true)});
        listenForChange(lonElement, function() {setShareLocationFlag(true)});
        // and add this to the table
        tableElement.tBodies[0].appendChild(newRow);
        // this changes the data
        setShareLocationFlag(true);
    }
}

function listenForChange(elementToListen, functionToCall) {
    if (elementToListen.addEventListener) {
        elementToListen.addEventListener('input', function() {
            // event handling code for sane browsers
            functionToCall();
        }, false);
    } else if (elementToListen.attachEvent) {
        elementToListen.attachEvent('onpropertychange', function() {
            // IE-specific event handling code
            functionToCall();
        });
    }
}

function displayShareLocationTableData() {
    var checkboxElement = document.getElementById('is_share_location');
    var tableElement = document.getElementById('location_share_table');
    var user = firebaseData.getUser();
    if (user && checkboxElement.checked) {
        // they want to share, show the table
        tableElement.style.display = null;
        // clear all the rows
        tableElement.tBodies[0].innerHTML = "";
        // and the map
        var map;
        var mapElement = document.getElementById('share_locations_map');
        mapElement.innerHTML = "";

        var rowTemplate = document.getElementById('location_share_location_template_row');
        // and get the data to put in here now
        firebaseData.getUserShareLocations(user, 
            function(querySnapshot) {
                querySnapshot.forEach(function (doc) {
                    // for each document (shared location) - add a new row to the table
                    var newRow = rowTemplate.cloneNode(true);
                    // set the ID of this new row
                    newRow.id = doc.id;
                    var data = doc.data();
                    // and set the content of this element
                    var refElement = newRow.querySelector('#location_share_ref');
                    var nameElement = newRow.querySelector('#location_share_name');
                    var emailElement = newRow.querySelector('#location_share_email');
                    var latElement = newRow.querySelector('#location_share_lat');
                    var lonElement = newRow.querySelector('#location_share_lon');
                    
                    refElement.value = data['reference'];
                    nameElement.value = data['user_name'];
                    emailElement.value = data['user_email'];
                    newRow.querySelector('#location_share_location').innerHTML = data['location'].latitude + ", " + data['location'].longitude;
                    latElement.value = data['location'].latitude;
                    lonElement.value = data['location'].longitude;

                    listenForChange(refElement, function() {setShareLocationFlag(true)});
                    listenForChange(nameElement, function() {setShareLocationFlag(true)});
                    listenForChange(emailElement, function() {setShareLocationFlag(true)});
                    listenForChange(latElement, function() {setShareLocationFlag(true)});
                    listenForChange(lonElement, function() {setShareLocationFlag(true)});

                    // and add this to the table
                    tableElement.tBodies[0].appendChild(newRow);
                    // setup the map the first item of data
                    if (!map) {
                        // setup the map centred on this first found location
                        map = new google.maps.Map(mapElement, {
                            center: {
                                lat: data['location'].latitude,
                                lng: data['location'].longitude
                            },
                            zoom: 8
                        });
                    }
                    // and put a pin on the map
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(data['location'].latitude, data['location'].longitude),
                        map: map,
                        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        title: data['reference']
                    });
                });

            },
            function(error) {
                console.log('failed to get the shared locations: ', error);
            });
    }
    else {
        // they don't want to share, hide the table
        tableElement.style.display = 'none';
    }
}

function initMap() {

}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});