
var lastFound = null;
var friendPageStarters = [];
var currentFriendPage = 0;

function findByName() {
    var foundContainer = document.getElementById('found_friends_container');
    // find all the users with the specified name
    var searchTerm = document.getElementById('search_text').value;
    
    // clear all the old data
    clearFindData();

    // and find the new stuff
    searchForWord(searchTerm, foundContainer);
}

function clearFindData() {
    // clear the data associated with finding friends
    lastFound = null;
    document.getElementById('found_friends_container').innerHTML = "";
    document.getElementById('search_text').value = "";
}

function searchForWord(searchTerm, foundContainer) {
    firebaseData.searchCollectionForWord(firebaseData.collectionLocations, searchTerm, lastFound,
        function(querySnapshot) {
            // success, add all to the HTML
            querySnapshot.forEach(function (doc) {
                // remember this for the next search
                lastFound = doc;
                // show each of these found documents in the HTML
                onFriendFound(foundContainer, doc.id, doc.data())
            });
        },
        function (error) {
            // failed
            console.log('searching failed: ', error);
        });
}

function onFriendFound(foundContainer, docId, docData) {
    // create the template
    var friendDiv = document.getElementById('template_found_friend').cloneNode(true);
    friendDiv.id = docId;
    // set the data
    var nameDiv = friendDiv.querySelector('#template_found_name');
    nameDiv.id = docId + "_name";
    nameDiv.innerHTML = docData.user_name;
    // email
    var emailDiv = friendDiv.querySelector('#template_found_email');
    emailDiv.id = docId + "_email";
    emailDiv.innerHTML = docData.user_email;
    // hidden UID
    var uidDiv = friendDiv.querySelector('#template_found_uid');
    uidDiv.id = docId + "_uid";
    uidDiv.innerHTML = docData.user_uid;

    // find the button
    var friendButton = friendDiv.querySelector('#template_friend_button');
    friendButton.id = docId + "_button";
    friendButton.onclick = function() {
        makeFriend(docId, docData);
    };

    // and add to the container
    foundContainer.appendChild(friendDiv);
}

function displayFriend(docId, docData, isScrollToShow) {
    var container = document.getElementById('friends_container');
    // create the template
    var friendDiv = document.getElementById('template_found_friend').cloneNode(true);
    friendDiv.id = docId;
    // set the data
    var nameDiv = friendDiv.querySelector('#template_found_name');
    nameDiv.id = docId + "_name";
    nameDiv.innerHTML = docData.name;
    // email
    var emailDiv = friendDiv.querySelector('#template_found_email');
    emailDiv.id = docId + "_email";
    emailDiv.innerHTML = docData.email;
    // hidden UID
    var uidDiv = friendDiv.querySelector('#template_found_uid');
    uidDiv.id = docId + "_uid";
    uidDiv.innerHTML = docData.user_uid;

    // find the button
    var friendButton = friendDiv.querySelector('#template_friend_button');
    friendButton.id = docId + "_button";
    friendButton.innerHTML = "Remove"
    friendButton.onclick = function() {
        deleteFriend(friendDiv, docId);
    };

    // and add to the container
    container.appendChild(friendDiv);
    if (isScrollToShow) {
        //friendDiv.scrollIntoView();
    }
}

function makeFriend(foundDataUid, foundData) {
    // attach to this friend by remembering the UID in our user's data
    var user = firebaseData.getUser();
    if (user) {
        var newFriend = firebaseData.defaultFriend(foundDataUid, foundData);
        firebaseData.addUserFriend(user.uid, newFriend,
            function(docRef) {
                // added!
                displayFriend(docRef.id, newFriend, true);
            }, null);
    }
}

function deleteFriend(friendDiv, friendDataUid) {
    // attach to this friend by remembering the UID in our user's data
    var user = firebaseData.getUser();
    if (user) {
        firebaseData.deleteUserFriend(user.uid, friendDataUid,
            function() {
                // removed!
                friendDiv.parentElement.removeChild(friendDiv);
            }, null);
    }
}

function showNextFriends() {
    // show the next page of friends
    if (currentFriendPage > 0 && !friendPageStarters[currentFriendPage]) {
        // we are not on page zero, but there is no starter, run out of friends!
        console.log('no more friends here');
    }
    else {
        ++currentFriendPage;
    }
    showActiveFriendsPage();
}

function showPreviousFriends() {
    // show the previous page of friends
    if (currentFriendPage > 0) {
        --currentFriendPage;
    }
    else {
        console.log('no more friends here - back to page one');
    }
    showActiveFriendsPage();
}

function showActiveFriendsPage() {
    document.getElementById('friends_container').innerHTML = "";
    var user = firebaseData.getUser();
    // and show this data
    var lastPageDoc = friendPageStarters[currentFriendPage - 1];
    if (currentFriendPage >= friendPageStarters.length) {
        // there isn't one yet for this page, push one now
        friendPageStarters.push(null);
    }
    // and get this data to show it
    firebaseData.getUserFriends(user.uid, lastPageDoc,
        function(querySnapshot) {
            querySnapshot.forEach(function (doc) {
                // remember this last doc for the page
                friendPageStarters[currentFriendPage] = doc;
                // show the friends we have
                displayFriend(doc.id, doc.data(), false);
            });
        }, null);
}

function populateUserData() {
    // fill this page with our data now
    var user = firebaseData.getUser();
    if (user) {
        friendPageStarters = [null];
        currentFriendPage = 0;
        // yey, so we can get the friends now
        showNextFriends();
    }
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});