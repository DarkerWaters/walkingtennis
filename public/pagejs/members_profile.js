// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

var isChangedLocation = false;
var permittedLocationShareCount = 0;
var sharedLocationIndex = 0;
var locationSharesDeleted = [];

function showMembershipChange() {
    document.getElementById('change_membership').style.display = null;
    document.getElementById('membership_button').style.display = 'none';
};

function showMembershipDelete() {
    document.getElementById('delete_membership').style.display = null;
    document.getElementById('show_delete_button').style.display = 'none';
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

function ensureUpToDateUserData(user, data) {
    // to be sure we have an up-to-date picture of our user, let's update their name and email here if wrong...
    if (data['name'] !== user.displayName || data['email' !== user.email]) {
        // update our data held about them here
        var userData = firebaseData.defaultUser(user.displayName, user.email);
        firebase.firestore().collection(firebaseData.collectionUsers).doc(user.uid).update(userData)
            .catch(function(error) {
                console.log("Error updating user information held against them", error);
            });
    }
}

function displayMembershipData(data) {
    /*
    TODO location setting when billing is enabled
    document.getElementById('home_location_lat').value = data['location'] ? data['location'].latitude : "";
    document.getElementById('home_location_lon').value = data['location'] ? data['location'].longitude : "";
    var locationString = "";
    if (data['location']) {
        locationString = Number(data['location'].latitude) + ", " + Number(data['location'].longitude);
    }
    document.getElementById('home_location_label').innerHTML = locationString;
    */

    if (firebaseData.isUserMember(data)) {
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
    
    if (firebaseData.isUserCoach(data)) {
        // there is no expiry, or it hasn't passed, this is active, we are a coach
        document.getElementById('membership-coach').checked = true;
    }
    else {
        // the expiry date has passed
        document.getElementById('membership-coach').checked = false;
        document.getElementById('membership-coach-expiry-input').style.display = 'none';
    }

    var date = data['expiry_coach'];
    if (date) {
        // there is an expiry date
        document.getElementById('membership-coach-expiry').value = date.toDate().toLocaleDateString();
        // so show it
        document.getElementById('membership-coach-expiry-input').style.display = null;
    }

    if (typeof permittedLocationShareCount !== "undefined") {
        // can share something
        document.getElementById('membership-lcount').checked = true;
        document.getElementById('membership-lcount-span').innerHTML = permittedLocationShareCount;
    }

    var permittedPromotionShareCount = data['lpromotions_permitted'];
    if (typeof permittedPromotionShareCount !== "undefined") {
        // can share something
        document.getElementById('membership-pcount').checked = true;
        document.getElementById('membership-pcount-span').innerHTML = permittedPromotionShareCount;
    }

    // show this map of where they are now.
    setHomeLocationMap();
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
        /*
        TODO location setting when billing is enabled
        document.getElementById('home_location_lat').value = "";
        document.getElementById('home_location_lon').value = "";
        document.getElementById('home_location_label').innerHTML = "";
        */
        document.getElementById('email-verified').checked = user.emailVerified;
        document.getElementById('user_image').src = user.photoURL;
        document.getElementById('membership-member').checked = true;
        document.getElementById('membership-coach').checked = false;
        document.getElementById('membership-coach-expiry-input').style.display = 'none';
        document.getElementById('lcount_permitted').innerHTML = "1";
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

                // display the communications options too
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
};

function setHomeLocationMap() {

    /*
    TODO location setting when billing is enabled

    // and the map
    var map;
    var mapElement = document.getElementById('home_locations_map');
    mapElement.innerHTML = "";

    var homeLat = Number(document.getElementById('home_location_lat').value);
    var homeLon = Number(document.getElementById('home_location_lon').value);
    var name = document.getElementById('name').value;

    // setup the map the first item of data
    var map = new google.maps.Map(mapElement, {
        center: {
            lat: homeLat,
            lng: homeLon
        },
        zoom: 8
    });
    // and put a pin on the map
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(homeLat, homeLon),
        map: map,
        icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        title: name
    });
    */
}

function setupMapAsPicker(map) {
    // kind of from https://jsfiddle.net/c213z4q8/13/
    // ** can add a box to type the location
    //https://developers-dot-devsite-v2-prod.appspot.com/maps/documentation/javascript/examples/geocoding-simple
    var geocoder = new google.maps.Geocoder;
    var infoWindow = new google.maps.InfoWindow;

    var pickerPin = new google.maps.Marker({ // Set the marker
        position: map.getCenter(), // Position marker to the middle of the map
        map: map, // assign the marker to our map variable
        title: 'Select this position' // Marker ALT Text
    });

    google.maps.event.addListener(map, 'click', function (event) {
        // place the pin at the clicked position and pan to it
        pickerPin.setPosition(event.latLng);
        map.panTo(pickerPin.getPosition());
        // set the default on the info window, but close it
        infoWindow.setContent(event.latLng.lat() + ',' + event.latLng.lng());
        infoWindow.close();
        // try to geo code this location to something nicer than the lat,lon string
        geocoder.geocode({'location': event.latLng}, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    //map.setZoom(11);
                    infoWindow.setContent(results[0].formatted_address);
                } else {
                    console.log('no map data found');
                }
            } 
            else {
                console.log('Geocoder failed due to: ' + status);
            }
            infoWindow.open(map, pin);
        });
    });
}

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
    /*var latEdit = document.getElementById('home_location_lat');
    var lonEdit = document.getElementById('home_location_lon');*/

    // stop the entry fields from being readonly
    nameEdit.removeAttribute('readonly');
    emailEdit.removeAttribute('readonly');
    /*latEdit.removeAttribute('readonly');
    lonEdit.removeAttribute('readonly');*/

    listenForChange(nameEdit, function() {isChangedLocation = true; setUserDataEdited(true);});
    listenForChange(emailEdit, function() {isChangedLocation = true; setUserDataEdited(true);});
    /*listenForChange(latEdit, function() {isChangedLocation = true; setUserDataEdited(true);});
    listenForChange(lonEdit, function() {isChangedLocation = true; setUserDataEdited(true);});*/

    // hide the change button
    document.getElementById('edit_profile_button').style.display = 'none';
    // and show the editing buttons
    document.getElementById('edit_profile_commit_button').style.display = null;
    document.getElementById('edit_profile_discard_button').style.display = null;
    // and the map ones
    /*
    document.getElementById('set_home_location_text').style.display = null;
    document.getElementById('set_home_location_button').style.display = null;
    document.getElementById('set_home_location_button_here').style.display = null;
    */
}

function disableEdit() {
    // hide the editing buttons
    document.getElementById('edit_profile_commit_button').style.display = 'none';
    document.getElementById('edit_profile_discard_button').style.display = 'none';
    // and the map ones
    /*
    document.getElementById('set_home_location_text').style.display = 'none';
    document.getElementById('set_home_location_button').style.display = 'none';
    document.getElementById('set_home_location_button_here').style.display = 'none';
    */
    // and show the edit button
    document.getElementById('edit_profile_button').style.display = null;
    document.getElementById('edit_profile_commit_button').classList.remove('special');

    // put the readonly back in
    var nameEdit = document.getElementById('name');
    var emailEdit = document.getElementById('email');
    /*
    var latEdit = document.getElementById('home_location_lat');
    var lonEdit = document.getElementById('home_location_lon');
    */

    // stop the entry fields from being readonly
    nameEdit.setAttribute('readonly', true);
    emailEdit.setAttribute('readonly', true);
    /*
    latEdit.setAttribute('readonly', true);
    lonEdit.setAttribute('readonly', true);
    */
}

function setUserDataEdited(isChanged) {
    if (isChanged) {
        document.getElementById('edit_profile_commit_button').classList.add('special');
    }
    else {
        document.getElementById('edit_profile_commit_button').classList.remove('special');
    }
}

function saveEdits() {
    // save the changes in the values to the profile
    var user = firebaseData.getUser();
    var newName = document.getElementById('name').value;
    var newEmail = document.getElementById('email').value;

    // disabled more editing
    disableEdit();

    // update the data in the profile
    if (user != null) {
        // update all the data in the profile here to that in the controls
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
            var latitude = Number(document.getElementById('home_location_lat').value);
            var longitude = Number(document.getElementById('home_location_lon').value);
            // create both types of location here
            var locationData = {};
            locationData['location'] = new firebase.firestore.GeoPoint(latitude, longitude);
            locationData['geohash'] = encodeGeohash([latitude, longitude]);

            // update this on the profile
            firebaseData.updateUserData(user, locationData, 
                function() {
                    // yey
                    isChangedLocation = false;
                },
                function(error) {
                    // oops
                    console.log("failed to set the home location for the user", error);
                });
        }
        document.getElementById('edit_profile_commit_button').classList.remove('special');
    }
}

function discardEdits() {
    // throw out the changes in the values to the profile
    document.getElementById('edit_profile_commit_button').style.display = 'none';
    document.getElementById('edit_profile_discard_button').style.display = 'none';
    // and the map ones
    document.getElementById('set_home_location_text').style.display = 'none';
    document.getElementById('set_home_location_button').style.display = 'none';
    document.getElementById('set_home_location_button_here').style.display = 'none';
    // disabled more editing
    disableEdit();
    document.getElementById('edit_profile_commit_button').classList.remove('special');
    // put the old data back
    populateUserData();
}

function setShareLocationFlag(isChanged) {
    if (isChanged) {
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
        var idData = splitId(tableRow);
        if (idData[0] !== 'new') {
            locationSharesDeleted.push(idData[0]);
        }
        // remove the row visually
        tableElement.tBodies[0].removeChild(tableRow);
        setShareLocationFlag(true);
    }
}

function splitId(elementToSplit) {
    var idString = elementToSplit.id;
    var index = idString.lastIndexOf('_');
    return [idString.substring(0, index), idString.substring(index + 1, idString.length)];
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
                var idData = splitId(tableRow);
                // get the raw lat and lon to create the location from
                /*
                TODO location setting when billing is enabled
                var latitude = Number(tableRow.querySelector('#location_share_lat_' + idData[1]).value);
                var longitude = Number(tableRow.querySelector('#location_share_lon_' + idData[1]).value);
                */
                // create this row as some data
                var locationData = firebaseData.defaultLocation(
                    tableRow.querySelector('#location_share_name_' + idData[1]).value,
                    tableRow.querySelector('#location_share_email_' + idData[1]).value,
                    user.uid,
                    tableRow.querySelector('#location_share_ref_' + idData[1]).value,
                    firebaseData.locationTypeMember,
                    /*new firebase.firestore.GeoPoint(latitude, longitude),
                    encodeGeohash([latitude, longitude])*/
                );
                
                if (idData[0] === 'new') {
                    // this is a new one, create this new document
                    firebaseData.addUserShareLocation(locationData,
                        function(newDocRef) {
                            // this worked great, set the ID of this row to the id of the doc and the unique id for the child ids.
                            tableRow.id = newDocRef.id + '_' + idData[1];
                            setShareLocationFlag(false);
                        },
                        function(error) {
                            // oops
                            console.log("Failed to set the new location data", error);
                        })

                }
                else {
                    // this is an existing location, update its data here
                    firebaseData.setUserShareLocation(idData[0], locationData, 
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
            firebaseData.deleteUserShareLocations(user, firebaseData.locationTypeMember,
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

function onFindLocation() {
    // get the search text
    var address = document.getElementById('set_home_location_text').value;
    if (address) {
        // go for it
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            'address': address
        }, function (results, status) {
            if (status === 'OK') {
                // set this data in the boxes
                document.getElementById('home_location_lat').value = results[0].geometry.location.lat;
                document.getElementById('home_location_lon').value = results[0].geometry.location.lng;
                document.getElementById('home_location_label').textContent = address;
                // and update the home map accordingly
                /*
                resultsMap.setCenter(results[0].geometry.location);
                var marker = new google.maps.Marker({
                    map: resultsMap,
                    position: results[0].geometry.location
                });*/
            } else {
                console.log('Geocode was not successful for the following reason: ' + status);
            }
        });
  
    }
}

function onSetHomeLocationToCurrent() {

    // try to auto-populate the location values
    firebaseData.getCurrentGeoLocation(function (position) {
        // have the location, set this into the lat and lon elements
        document.getElementById('home_location_lat').value = position.coords.latitude;
        document.getElementById('home_location_lon').value = position.coords.longitude;
        document.getElementById('home_location_label').innerHTML = position.coords.latitude + ", " + position.coords.longitude;
        // do the reverse lookup on this location
        var geocoder = new google.maps.Geocoder;
        var gLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        // try to geo code this location to something nicer than the lat,lon string
        geocoder.geocode({'location': gLocation}, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    // good results, set the string to this
                    document.getElementById('home_location_label').textContent = results[0].formatted_address;
                } else {
                    console.log('no map data found');
                }
            } 
            else {
                console.log('Geocoder failed due to: ' + status);
            }
        });
    });
}

function onClickAddSharedLocation() {
    // they want another location, can we?
    var tableElement = document.getElementById('location_share_table');

    if (!permittedLocationShareCount || permittedLocationShareCount > tableElement.tBodies[0].children.length) {
        // we can add another, add it here
        var rowTemplate = document.getElementById('location_share_location_template_row');
        var newRow = rowTemplate.cloneNode(true);
        // set the ID of this new row
        newRow.id = 'new_' + ++sharedLocationIndex;
        // listen to changes on this row
        var refElement = newRow.querySelector('#location_share_ref');
        var nameElement = newRow.querySelector('#location_share_name');
        var emailElement = newRow.querySelector('#location_share_email');
        /*
        TODO location setting when billing is enabled
        var latElement = newRow.querySelector('#location_share_lat');
        var lonElement = newRow.querySelector('#location_share_lon');
        var locElement = newRow.querySelector('#location_share_location');*/

        // set the name and the email to the user's name and email
        nameElement.value = document.getElementById('name').value;
        emailElement.value = document.getElementById('email').value;

        /*
        // try to auto-populate the location values
        firebaseData.getCurrentGeoLocation(function (position) {
            // have the location, set this into the lat and lon elements
            latElement.value = position.coords.latitude;
            lonElement.value = position.coords.longitude;
            locElement.innerHTML = position.coords.latitude + ", " + position.coords.longitude;
        });
        */

        // these id's won't be unique as we have taken them from a template and will add repeatedly
        // let's change them to something nice (use the sharedLocationIndex of this new row)
        refElement.id += '_' + sharedLocationIndex;
        nameElement.id += '_' + sharedLocationIndex;
        emailElement.id += '_' + sharedLocationIndex;
        /*latElement.id += '_' + sharedLocationIndex;
        lonElement.id += '_' + sharedLocationIndex;
        locElement.id += '_' + sharedLocationIndex;
        */
                
        listenForChange(refElement, function() {setShareLocationFlag(true)});
        listenForChange(nameElement, function() {setShareLocationFlag(true)});
        listenForChange(emailElement, function() {setShareLocationFlag(true)});
        /*
        listenForChange(latElement, function() {setShareLocationFlag(true)});
        listenForChange(lonElement, function() {setShareLocationFlag(true)});
        */
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

        /*
        TODO location setting when billing is enabled
        // and the map
        var map;
        var mapElement = document.getElementById('share_locations_map');
        mapElement.innerHTML = "";
        */

        var rowTemplate = document.getElementById('location_share_location_template_row');
        // and get the data to put in here now
        firebaseData.getUserShareLocations(user, 
            function(querySnapshot) {
                querySnapshot.forEach(function (doc) {
                    // for each document (shared location) - add a new row to the table
                    var data = doc.data();
                    if (data['type'] === firebaseData.locationTypeMember) {
                        // this is a member's share of location, show this
                        var newRow = rowTemplate.cloneNode(true);
                        // set the ID of this new row
                        newRow.id = doc.id + '_' + ++sharedLocationIndex;
                        
                        // and set the content of this element
                        var refElement = newRow.querySelector('#location_share_ref');
                        var nameElement = newRow.querySelector('#location_share_name');
                        var emailElement = newRow.querySelector('#location_share_email');
                        /*TODO location setting when billing is enabled
                        var latElement = newRow.querySelector('#location_share_lat');
                        var lonElement = newRow.querySelector('#location_share_lon');
                        var locElement = newRow.querySelector('#location_share_location');
                        */

                        // these id's won't be unique as we have taken them from a template and will add repeatedly
                        // let's change them to something nice (use the sharedLocationIndex of this new row)
                        refElement.id += '_' + sharedLocationIndex;
                        nameElement.id += '_' + sharedLocationIndex;
                        emailElement.id += '_' + sharedLocationIndex;
                        /*latElement.id += '_' + sharedLocationIndex;
                        lonElement.id += '_' + sharedLocationIndex;
                        locElement.id += '_' + sharedLocationIndex;*/
                        
                        // set the data on these elements
                        refElement.value = data['reference'];
                        nameElement.value = data['user_name'];
                        emailElement.value = data['user_email'];
                        /*latElement.value = data['location'].latitude;
                        lonElement.value = data['location'].longitude;
                        locElement.innerHTML = data['location'].latitude + ", " + data['location'].longitude;*/

                        // and listen to them
                        listenForChange(refElement, function() {setShareLocationFlag(true)});
                        listenForChange(nameElement, function() {setShareLocationFlag(true)});
                        listenForChange(emailElement, function() {setShareLocationFlag(true)});
                        /*listenForChange(latElement, function() {setShareLocationFlag(true)});
                        listenForChange(lonElement, function() {setShareLocationFlag(true)});*/

                        // and add this to the table
                        tableElement.tBodies[0].appendChild(newRow);
                        /*
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
                        */
                    }
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

function closeConfirmContainer() {
    document.getElementById('purchase_confirm_container').style.display = 'none';
}

function showConfirmContainer(description, buttonText, buttonFunction) {
    var confirmContainer = document.getElementById('purchase_confirm_container');
    confirmContainer.style.display = null;
    var confirmText = confirmContainer.querySelector('#confirmation_text');
    var confirmButton = confirmContainer.querySelector('#confirmation_button');
    confirmText.innerHTML = description;
    confirmButton.innerHTML = buttonText;
    confirmButton.onclick = buttonFunction;
}

function purchaseTrialPackage() {
    // show the container to check they are happy
    
    // check ur current status
    var user = firebaseData.getUser();
    if (!user) {
        // not logged in
        showConfirmContainer(
            'Sorry, but you are not logged in. Please log in, or create a log in, in order to start your trial.',
            'Log in',
            function() {
                // log them in and close the container
                signinFirebase();
                closeConfirmContainer();
            });
    }
    else {
        // we are logged in, get the user data
        firebaseData.getUserData(user, function(userData) {
            if (userData.coach_trial_used) {
                // they used their trial already
                showConfirmContainer(
                    'Sorry, our records show that you already tried the trial, please purchase a package to gain access to the coaching materials.',
                    'Close',
                    function() {
                        // close the container
                        closeConfirmContainer();
                    });
            }
            else if (userData.expiry_coach) {
                // they used their trial already
                showConfirmContainer(
                    'Sorry, our records show that you were already (or are still are) a coach. Please purchase a package to gain access to the coaching materials.',
                    'Close',
                    function() {
                        // close the container
                        closeConfirmContainer();
                    });
            }
            else {
                // start the trial
                showConfirmContainer(
                    'This will start your 7 days of access to online coaching materials. Click that you want to proceed and refresh the page to get the new menu options!',
                    'Start Trial',
                    function() {
                        // log them in and close the container
                        firebaseData.startUserCoachingTrial(user.uid, function() {
                            // yey
                            window.location.reload();
                        });
                        closeConfirmContainer();
                    });
            }
        },
        function(error) {
            showConfirmContainer(
                ('Sorry, something failed when trying to get your user data, please log-in again? ', error),
                'Log in',
                function() {
                    // log them in and close the container
                    signinFirebase();
                    closeConfirmContainer();
                });

        });
        
    }
    /*
    // show the container to check they are happy
    var confirmContainer = document.getElementById('purchase_confirm_container');
    confirmContainer.style.display = null;
    var confirmText = confirmContainer.querySelector('#confirmation_text');
    confirmText.innerHTML = 'This will start your 7 days of access to online coaching materials. Click that you want to proceed and refresh the page to get the new menu options!';
    var confirmButton = confirmContainer.querySelector('#confirmation_button');
    confirmButton.innerHTML = "Start Trial";
    confirmButton.onclick = function() {
        // start the trial
        alert('start coaching trial');
        closeConfirmContainer();
    }
    */
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});