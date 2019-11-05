var lastFound = null;
var messagePageStarters = [];
var currentMessagePage = 0;

function displayMessage(docId, docData, isScrollToShow) {
    var container = document.getElementById('messages_container');
    // create the template
    var messageDiv = document.getElementById('template_message').cloneNode(true);
    messageDiv.id = docId;
    messageDiv.style.display = null;
    // set the data
    var nameDiv = messageDiv.querySelector('#template_message_from');
    nameDiv.id = docId + "_name";
    nameDiv.innerHTML = docData.from_name;
    // email
    var contentDiv = messageDiv.querySelector('#template_message_content');
    contentDiv.id = docId + "_content";
    contentDiv.innerHTML = docData.message;
    // hidden UID
    var uidDiv = messageDiv.querySelector('#template_message_from_uid');
    uidDiv.id = docId + "_uid";
    uidDiv.innerHTML = docData.from;
    // when
    var whenDiv = messageDiv.querySelector('#template_message_when');
    whenDiv.id = docId + "_when";
    var messageDate = docData.last_update.toDate();
    if (messageDate) {
        whenDiv.innerHTML = messageDate.toLocaleString();
    }
    else {
        whenDiv.style.display = 'none';
    }

    // find the buttons
    var deleteButton = messageDiv.querySelector('#template_message_delete_button');
    deleteButton.id = docId + "_delete";
    deleteButton.onclick = function() {
        deleteMessage(docId, messageDiv);
    };

    var replyButton = messageDiv.querySelector('#template_message_reply_button');
    replyButton.id = docId + "_reply";
    replyButton.onclick = function() {
        replyToFriend(docData.from_name, docData.from);
    };

    var readButton = messageDiv.querySelector('#template_message_read');
    readButton.id = docId + "_read";
    setReadButton(docId, readButton, docData.is_read);

    // and add to the container
    container.appendChild(messageDiv);
    if (isScrollToShow) {
        messageDiv.scrollIntoView();
    }
}

function setReadButton(docId, readButton, isRead) {
    if (isRead) {
        //readButton.innerHTML = "un-read";
        readButton.classList.remove('special');
        readButton.onclick = function() {
            setMessageAsRead(docId, readButton, false);
        };
    }
    else {
        //readButton.innerHTML = "Read";
        readButton.classList.add('special');
        readButton.onclick = function() {
            setMessageAsRead(docId, readButton, true);
        };
    }
}

function replyToFriend(friendName, friendUid) {
    // send a message to this friend
    showMessageContainer(friendName, friendUid);
}

function deleteMessage(messageUid, messageDiv) {
    // delete this message
    var user = firebaseData.getUser();
    if (user) {
        firebaseData.deleteUserMessage(user.uid, messageUid,
            function() {
                // this worked, remove this message from the display of messages
                if (messageDiv && messageDiv.parentElement) {
                    messageDiv.parentElement.removeChild(messageDiv);
                }
            });
    }
}

function setMessageAsRead(messageUid, readButton, isRead) {
    // delete this message
    var user = firebaseData.getUser();
    if (user) {
        firebaseData.readUserMessage(user.uid, messageUid, isRead,
            function() {
                // this worked, remove this the read button 
                if (readButton) {
                    setReadButton(messageUid, readButton, isRead);
                }
            });
    }
}

function showNextMessages() {
    // show the next page of messages
    if (currentMessagePage > 0 && !messagePageStarters[currentMessagePage]) {
        // we are not on page zero, but there is no starter, run out of messages!
        console.log('no more messages here');
        currentMessagePage = 1;
    }
    else {
        ++currentMessagePage;
    }
    showActiveMessagesPage();
}

function showPreviousMessages() {
    // show the previous page of messages
    if (currentMessagePage > 1) {
        --currentMessagePage;
    }
    else {
        console.log('no more messages here - back to page one');
    }
    showActiveMessagesPage();
}

function showActiveMessagesPage() {
    document.getElementById('messages_container').innerHTML = "";
    var user = firebaseData.getUser();
    // and show this data
    var lastPageDoc = messagePageStarters[currentMessagePage - 1];
    if (currentMessagePage >= messagePageStarters.length) {
        // there isn't one yet for this page, push one now
        messagePageStarters.push(null);
    }
    document.getElementById('page_span').innerHTML = "Page " + currentMessagePage;
    // and get this data to show it
    firebaseData.getUserMessages(user.uid, lastPageDoc,
        function(querySnapshot) {
            if (querySnapshot.empty) {
                // nothing to show on this new page, go back a page
                if (currentMessagePage > 1) {
                    --currentMessagePage;
                    // show this new page
                    showActiveMessagesPage();
                }
            }
            else {
                // show all the messages
                querySnapshot.forEach(function (doc) {
                    // remember this last doc for the page
                    messagePageStarters[currentMessagePage] = doc;
                    // show the messages we have
                    displayMessage(doc.id, doc.data(), false);
                });
            }
        }, null);
}

function populateUserData() {
    // fill this page with our data now
    var user = firebaseData.getUser();
    if (user) {
        messagePageStarters = [null];
        currentMessagePage = 0;
        // yey, so we can get the messages now
        showNextMessages();
    }
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});