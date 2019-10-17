// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

var isChangedLocation = false;
var permittedLocationShareCount = 0;
var sharedLocationIndex = 0;
var locationSharesDeleted = [];
var retrievedLocation = null;
var userName = "";
var userEmail = "";

function populateUserData() {
    var user = firebaseData.getUser();
    if (user) {
        // populate the form, defaulting everything we don't know yet
        document.getElementById('count_permitted').innerHTML = "5";

        userName = user.displayName;
        userEmail = user.email;
        permittedLocationShareCount = 0;

        // get the user data from firebase here
        firebaseData.getUserData(user, 
            function(data) {
                // we have the user data here, set the data correctly
                userName = data['name'];
                userEmail = data['email'];
                permittedLocationShareCount = data['lpromotions_permitted'];
                if (!permittedLocationShareCount) {
                    permittedLocationShareCount = 0;
                }
                document.getElementById('count_permitted').innerHTML = permittedLocationShareCount;
                displayShareLocationTableData();
            }, function(error) {
                // this is the failure to get the data, do our best I suppose
                console.log("Failed to get the firestore user data for " + user + ":", error);
            });

        // try to auto-populate the location values
        firebaseData.getCurrentGeoLocation(function (position) {
            retrievedLocation = position;
        });
    }
};

function setShareLocationFlag(isChanged) {
    if (isChanged) {
        document.getElementById('edit_share_location_commit_button').classList.add('special');
    }
    else {
        document.getElementById('edit_share_location_commit_button').classList.remove('special');
    }
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

function saveLocationShareEdits() {
    var tableElement = document.getElementById('location_share_table');
    var user = firebaseData.getUser();
    if (user) {
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
        // save all the edits to locations we have made, get all the rows - each row is a shared location
        for (var i = 0; i < tableElement.tBodies[0].children.length; ++i) {
            var tableRow = tableElement.tBodies[0].children[i];
            var idData = splitId(tableRow);
            // create this row as some data
            var locationData = {};
            locationData['reference'] = tableRow.querySelector('#location_share_ref_' + idData[1]).value;
            locationData['user_name'] = tableRow.querySelector('#location_share_name_' + idData[1]).value;
            locationData['user_email'] = tableRow.querySelector('#location_share_email_' + idData[1]).value;
            locationData['website'] = tableRow.querySelector('#location_share_web_' + idData[1]).value;
            locationData['content'] = tableRow.querySelector('#location_share_content_' + idData[1]).value;
            locationData['user_uid'] = user.uid;
            locationData['type'] = 'promotion';
            // get the raw lat and lon to create the location from
            var latitude = Number(tableRow.querySelector('#location_share_lat_' + idData[1]).value);
            var longitude = Number(tableRow.querySelector('#location_share_lon_' + idData[1]).value);
            // create both types of location here
            locationData['location'] = new firebase.firestore.GeoPoint(latitude, longitude);
            locationData['geohash'] = encodeGeohash([latitude, longitude]);
            
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
}

function onClickAddSharedLocation() {
    // they want another location, can we?
    var tableElement = document.getElementById('location_share_table');

    if (permittedLocationShareCount > tableElement.tBodies[0].children.length) {
        // we can add another, add it here
        var rowTemplate = document.getElementById('location_share_location_template_row');
        var newRow = rowTemplate.cloneNode(true);
        // set the ID of this new row
        newRow.id = 'new_' + ++sharedLocationIndex;
        // listen to changes on this row
        var refElement = newRow.querySelector('#location_share_ref');
        var nameElement = newRow.querySelector('#location_share_name');
        var emailElement = newRow.querySelector('#location_share_email');
        var webElement = newRow.querySelector('#location_share_web');
        var contentElement = newRow.querySelector('#location_share_content');
        var latElement = newRow.querySelector('#location_share_lat');
        var lonElement = newRow.querySelector('#location_share_lon');
        var locElement = newRow.querySelector('#location_share_location');

        // initialise the mail and name cells
        nameElement.value = userName;
        emailElement.value = userEmail;

        // set the default location properly
        if (retrievedLocation) {
            latElement.value = retrievedLocation.coords.latitude;
            lonElement.value = retrievedLocation.coords.longitude;
            locElement.innerHTML = Number(retrievedLocation.coords.latitude) + ", " + Number(retrievedLocation.coords.longitude);
        }

        // these id's won't be unique as we have taken them from a template and will add repeatedly
        // let's change them to something nice (use the sharedLocationIndex of this new row)
        refElement.id += '_' + sharedLocationIndex;
        nameElement.id += '_' + sharedLocationIndex;
        emailElement.id += '_' + sharedLocationIndex;
        webElement.id += '_' + sharedLocationIndex;
        contentElement.id += '_' + sharedLocationIndex;
        latElement.id += '_' + sharedLocationIndex;
        lonElement.id += '_' + sharedLocationIndex;
        locElement.id += '_' + sharedLocationIndex;
                
        listenForChange(refElement, function() {setShareLocationFlag(true)});
        listenForChange(nameElement, function() {setShareLocationFlag(true)});
        listenForChange(emailElement, function() {setShareLocationFlag(true)});
        listenForChange(webElement, function() {setShareLocationFlag(true)});
        listenForChange(contentElement, function() {setShareLocationFlag(true)});
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
    var tableElement = document.getElementById('location_share_table');
    var user = firebaseData.getUser();
    if (user) {
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
                    var data = doc.data();
                    if (data['type'] === 'promotion') {
                        // this is the right type
                        var newRow = rowTemplate.cloneNode(true);
                        // set the ID of this new row
                        newRow.id = doc.id + '_' + ++sharedLocationIndex;
                        var data = doc.data();
                        // and set the content of this element
                        var refElement = newRow.querySelector('#location_share_ref');
                        var nameElement = newRow.querySelector('#location_share_name');
                        var emailElement = newRow.querySelector('#location_share_email');
                        var webElement = newRow.querySelector('#location_share_web');
                        var contentElement = newRow.querySelector('#location_share_content');
                        var latElement = newRow.querySelector('#location_share_lat');
                        var lonElement = newRow.querySelector('#location_share_lon');
                        var locElement = newRow.querySelector('#location_share_location');

                        // these id's won't be unique as we have taken them from a template and will add repeatedly
                        // let's change them to something nice (use the sharedLocationIndex of this new row)
                        refElement.id += '_' + sharedLocationIndex;
                        nameElement.id += '_' + sharedLocationIndex;
                        emailElement.id += '_' + sharedLocationIndex;
                        webElement.id += '_' + sharedLocationIndex;
                        contentElement.id += '_' + sharedLocationIndex;
                        latElement.id += '_' + sharedLocationIndex;
                        lonElement.id += '_' + sharedLocationIndex;
                        locElement.id += '_' + sharedLocationIndex;
                        
                        // set the data on these elements
                        refElement.value = data['reference'];
                        nameElement.value = data['user_name'];
                        emailElement.value = data['user_email'];
                        webElement.value = data['website'];
                        contentElement.value = data['content'];
                        latElement.value = data['location'].latitude;
                        lonElement.value = data['location'].longitude;
                        locElement.innerHTML = Number(data['location'].latitude) + ", " + Number(data['location'].longitude);

                        // and listen to them
                        listenForChange(refElement, function() {setShareLocationFlag(true)});
                        listenForChange(nameElement, function() {setShareLocationFlag(true)});
                        listenForChange(emailElement, function() {setShareLocationFlag(true)});
                        listenForChange(latElement, function() {setShareLocationFlag(true)});
                        listenForChange(lonElement, function() {setShareLocationFlag(true)});

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

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});