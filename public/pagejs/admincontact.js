

function populateUserData() {
    // fill this page with our data now, by default they cannot contact us
    document.getElementById('contact_controls').style.display = 'none';
    var user = firebaseData.getUser();
    if (user) {
        firebaseData.getUserData(user,
            function(docData) {
                // have the data
                if (firebaseData.isUserMember(docData)) {
                    // we are a member, show the controls
                    document.getElementById('contact_controls').style.display = null;
                    var messageContent = document.getElementById('message_content');
                    if (messageContent) {
                        messageContent.focus();
                    }
                }
            });
    }
}

function sendAdminMessage() {
    // get the message content from the control
    var messageContent = document.getElementById('message_content');
    if (messageContent) {
        // send this message
        firebaseData.sendAdminMessage(messageContent.value,
            function() {
                // this was sent
                messageContent.value = "";
                showAlertBox('Message sent, thank you. we will do our best to get back to you as quickly as possible.');
            });
    }
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});