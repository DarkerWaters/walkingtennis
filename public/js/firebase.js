function signinFirebase() {
    if (!firebaseData.getUser()) {
        // Initialize the FirebaseUI Widget using Firebase.
        // https://firebase.google.com/docs/auth/web/firebaseui
        var uiConfig = {
            callbacks: {
                signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                    // signed in successfully, hide the box we used to select the type
                    document.getElementById('firebase_login_container').style.display = "none";
                    // and we can get the data here
                    /*
                    var user = authResult.user;
                    var credential = authResult.credential;
                    var isNewUser = authResult.additionalUserInfo.isNewUser;
                    var providerId = authResult.additionalUserInfo.providerId;
                    var operationType = authResult.operationType;
                    // Do something with the returned AuthResult.
                    */
                    // Return type determines whether we continue the redirect automatically
                    // or whether we leave that to developer to handle.
                    return true;
                },
                signInFailure: function (error) {
                    // Some unrecoverable error occurred during sign-in.
                    document.getElementById('firebase_login_container').style.display = "none";
                    // Return a promise when error handling is completed and FirebaseUI
                    // will reset, clearing any UI. This commonly occurs for error code
                    // 'firebaseui/anonymous-upgrade-merge-conflict' when merge conflict
                    // occurs. Check below for more details on this.
                    return handleUIError(error);
                },
                uiShown: function () {
                    // The widget is rendered, hide the loader button
                }
            },
            credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,
            // Query parameter name for mode.
            queryParameterForWidgetMode: 'mode',
            // Query parameter name for sign in success url.
            queryParameterForSignInSuccessUrl: 'signInSuccessUrl',
            // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
            signInFlow: 'popup',
            signInSuccessUrl: '#',
            signInOptions: [
                // Leave the lines as is for the providers you want to offer your users.
                firebase.auth.GoogleAuthProvider.PROVIDER_ID
                /*,firebase.auth.TwitterAuthProvider.PROVIDER_ID
                {
                    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    // Whether the display name should be displayed in the Sign Up page.
                    requireDisplayName: true
                }*/
                /*,{
                    provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                    // Invisible reCAPTCHA with image challenge and bottom left badge.
                    recaptchaParameters: {
                        type: 'image',
                        size: 'invisible',
                        badge: 'bottomleft'
                    }
                }*/
                //,firebase.auth.FacebookAuthProvider.PROVIDER_ID
                //,firebase.auth.GithubAuthProvider.PROVIDER_ID
                ,firebase.auth.EmailAuthProvider.PROVIDER_ID
            ],
            // tosUrl and privacyPolicyUrl accept either url string or a callback
            // function.
            // Terms of service url.
            tosUrl: 'https://www.walkingtennis.org/adminterms.html',
            // Privacy policy url.
            privacyPolicyUrl: 'https://www.walkingtennis.org/adminprivacy.html'
        };

        // show the container to login with
        var uiElement = document.getElementById('firebase_login_container');
        uiElement.style.display = null;
        uiElement.scrollIntoView();

        // Initialize the FirebaseUI Widget using Firebase.
        if(firebaseui.auth.AuthUI.getInstance()) {
            const ui = firebaseui.auth.AuthUI.getInstance();
            ui.start('#firebase_login_container', uiConfig);
        } else {
            const ui = new firebaseui.auth.AuthUI(firebase.auth());
            ui.start('#firebase_login_container', uiConfig);	
        }
    }
}

function cancelLoginUi() {
    var uiElement = document.getElementById('firebase_login_container');
    if (uiElement) {
        uiElement.style.display = 'none';
    }
}

function updateFirebaseUserDisplay(user) {
    // update the dispay according the user being logged on or not
    updateMenuButtons(user, false, false);
    // update user role details
    updateFirebaseUserItems(user);
}

function initialiseFirebaseLoginButton() {
    // setup the login button properly
    var signIn = document.getElementById('firebaseSignIn');
    if (signIn) {
        firebase.auth().onAuthStateChanged(function(user) {
            // update the display of the user here
            updateFirebaseUserDisplay(user);
            // dispatch this change to the document
            document.dispatchEvent(new Event('firebaseuserchange'));
        });
    }
};

function showFirebaseLoginButtons(user, userData) {
    // get if the user is a coach / admin
    var isCoach = firebaseData.isUserCoach(userData);
    var isAdmin = firebaseData.isUserAdmin(userData);
    // and update the buttons accordingly
    updateMenuButtons(user, isCoach, isAdmin);
}

function removeFirebaseLoginButtons() {
    // remove all the coaching options
    updateMenuButtons(null, false, false);
}

function updateMenuButtons(user, isCoach, isAdmin) {

    // update the sign in buttons on the menu
    var signIn = document.getElementById('firebaseSignIn');
    if (signIn) {
        if (user) {
            // User is signed in, change the profile button to say the member's name instead
            signIn.textContent = sanitizeHTML(user.displayName) + "...";
            signIn.classList.remove('button');
            signIn.classList.remove('special');
        } else {
            // No user is signed in.
            signIn.textContent = 'Log In...';
            signIn.classList.add('button');
            signIn.classList.add('special');
        }
    }
    // hide or show the extras menus accordingly
    var extraItems = document.getElementsByClassName("menu_extras");
    for (var i = 0; i < extraItems.length; i++) {
        if (isCoach) {
            extraItems[i].style.display = null;
        }
        else {
            extraItems[i].style.display = 'none';
        }
    }
    // and admin if we are admin
    var adminItems = document.getElementsByClassName("menu_admin");
    for (var i = 0; i < adminItems.length; i++) {
        if (isAdmin) {
            adminItems[i].style.display = null;
        }
        else {
            adminItems[i].style.display = 'none';
        }
    }
    // and the members ones if logged in
    var membersItems = document.getElementsByClassName("menu_members");
    for (var i = 0; i < membersItems.length; i++) {
        if (user) {
            membersItems[i].style.display = null;
        }
        else {
            membersItems[i].style.display = 'none';
        }
    }
    // the drop-down menu is different though - we lost all our ids so we have to find them by hand
    var dropDownMenus = document.getElementsByClassName('nav_menu_buttons');
    if (dropDownMenus && dropDownMenus.length === 1) {
        var dropDownItems = dropDownMenus[0].getElementsByClassName("link");
        var isHidingBelow = false;
        for (var i = 0; i < dropDownItems.length; ++i) {
            if (dropDownItems[i].classList.contains('depth-0')) {
                // by default, we are not hiding this
                isHidingBelow = false;
                dropDownItems[i].style.display = null;
                // this is a top-level, is it the admin one
                if (dropDownItems[i].innerText.includes('Admin')) {
                    // this is admin
                    if (!isAdmin) {
                        dropDownItems[i].style.display = 'none';
                        isHidingBelow = true;
                    }
                }
                else if (dropDownItems[i].innerText.includes('Extras')) {
                    // this is extras
                    if (!isCoach) {
                        dropDownItems[i].style.display = 'none';
                        isHidingBelow = true;
                    }
                }
                else if (dropDownItems[i].innerText.includes('...')) {
                    // this is the log in button
                    if (user) {
                        // show the name, not the log in text
                        dropDownItems[i].textContent = sanitizeHTML(user.displayName) + "...";
                    }
                    else {
                        dropDownItems[i].textContent = "Log In..."
                        isHidingBelow = true;
                    }
                }
            }
            else if (isHidingBelow) {
                // hide this, it's below a top-level one we want to hide
                dropDownItems[i].style.display = 'none';
            }
            else {
                // show it then
                dropDownItems[i].style.display = null;
            }
        }
    }
}
    
function updateFirebaseUserItems (user) {
    // show the extra buttons when logging in changes
    if (user) {	
        firebaseData.getUserData(user, function(userData) {
            // we have the data, display the coaching things if we are a coach
            showFirebaseLoginButtons(user, userData);
        },
        function(error) {
            console.log("Failed to get the user data;", error);
            // failed to get the data
            removeFirebaseLoginButtons();
        })
    }
    else {
        // not logged in
        removeFirebaseLoginButtons();
    }
}

/*!
 * Sanitize and encode all HTML in a user-submitted string
 * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {String} str  The user-submitted string
 * @return {String} str  The sanitized string
 */
var sanitizeHTML = function (str) {
	var temp = document.createElement('div');
	temp.textContent = str;
	return temp.innerHTML;
};

var hideMessageContainer = function() {
    var messageBox = document.getElementById('message_container');
    if (messageBox) {
        messageBox.style.display = 'none';
        messageBox.querySelector('#message_content').value = "";
    }
}

var showMessageContainer = function(friendName, friendUid, onSendSuccess, onSendFailure) {
    var messageBox = document.getElementById('message_container');
    if (messageBox) {
        messageBox.style.display = null;
        messageBox.querySelector('#message_dest_name').innerHTML = friendName;
        messageBox.querySelector('#message_dest_uid').innerHTML = friendUid;
        var messageContent = messageBox.querySelector('#message_content');
        messageContent.focus();

        // handle the button press
        messageBox.querySelector('#message_send').onclick = function() {
            firebaseData.sendMessage(friendUid, messageContent.value, onSendSuccess, onSendFailure);
            hideMessageContainer();
        };
    }
}

function showAlertBox(message) {
    var messageBox = document.getElementById('alert_box');
    messageBox.querySelector('#alert_box_content').textContent = message;
    messageBox.style.display = null;
    setTimeout(function() { hideAlertBox() }, 5000);
}

function hideAlertBox(message) {
    var messageBox = document.getElementById('alert_box');
    messageBox.style.display = 'none';
}

const firebaseData = {

    collectionUsers : 'users',
    collectionAdminMessages: 'admin_messages',
    collectionLessons : 'lessons',
    collectionLocations : 'locations',
    collectionLessonPlans : 'lesson_plans',
    collectionCoachingLessons : 'coaching_lessons',
    collectionUserFriends: 'friends',
    collectionUserMessages : 'messages',
    collectionLessonContents: 'contents',

    locationTypeMember : 'member',

    lcRef : function (str) {
        if (!str) {
            return str;
        }
        else {
            // remove all spaces and make it lowercase
            str = str.toLowerCase().replace(/\s/g,'');
            // and get rid of anything too weird
            str = str.replace(/\W/g, '');
            if (str.length > 1 && str.slice(-1) === 's') {
                // remove any trailing 's' characters
                str = str.slice(0, -1);
            }
            return str;
        }
    },

    lcWords : function(str) {
        if (!str) {
            return [];
        }
        else {
            // make the words split from the string
            var words = [];
            var toProcess = str.toLowerCase().split(/\s/);
            for (var i = 0; i < toProcess.length; ++i) {
                // for each word from the string split, add it to the array
                var word = toProcess[i];
                words.push(firebaseData.lcRef(word));
                // and combine it with all following it
                for (var j = i + 1; j < toProcess.length; ++j) {
                    word += toProcess[j];
                    words.push(firebaseData.lcRef(word));
                }
            }
            // return all the words combined into a nice array of options to search for
            return words;
        }
    },

    newUser : function(user) {
        return firebaseData.autoCompleteData({
            // setup the blank user data here
            name: user.displayName,
            email: user.email,
            isAdmin: false,
            lcount_permitted: 5,
            lpromotions_permitted: 0,
            isRxEmailFromWkta: true,
            isRxEmailFromPlayers: true,
            isRxEmailFromPartners: true,
            joined_date: fieldValue.serverTimestamp(),
            expiry_coach: fieldValue.serverTimestamp(),
            expiry_member: null
        });
    },

    defaultUser : function(userName, userEmail) {
        return firebaseData.autoCompleteData({
            name : userName,
            email : userEmail,
            // don't create empty data - to prevent over-writing any existing data on the update
            /*
            expiry_coach: fieldValue.serverTimestamp(),
            expiry_member : null,
            geohash : null,
            isAdmin : false,
            isRxEmailFromPartners : true,
            isRxEmailFromPlayers : true,
            isShareLocations : true,
            joined_date: fieldValue.serverTimestamp(),
            last_coaching_lesson : null,
            last_members_lesson : null,
            lcount_permitted : 5,
            location : null,
            lpromotions_permitted : 0,
            */
        });
    },

    defaultLocation : function(name, email, uid, referenceName, typeStr, locationData, geoHash) {
        var newData = {
            reference : referenceName,
            type : typeStr,
            user_email : email,
            user_name : name,
            user_uid : uid
            // don't create empty data - to prevent over-writing any existing data on the update
        };
        if (locationData && geoHash) {
            newData['location'] = locationData;
            newData['geohash'] = geoHash;
        }
        return firebaseData.autoCompleteData(newData);
    },

    defaultLesson : function() {
        return firebaseData.autoCompleteData({
            name: "New Lesson",
            subtitle: "A newly added lesson just now",
            priority: 0,
            progress_options: ""
        });
    },

    defaultFriend : function(locationUid, locationData) {
        return firebaseData.autoCompleteData({
            name: locationData.user_name,
            email: locationData.user_email,
            user_uid: locationData.user_uid,
            location_uid: locationUid,
        });
    },

    defaultLessonSection : function() {
        return firebaseData.autoCompleteData({
            title: "New Section",
            priority: 0,
            subtitle: "A newly added section just now",
            text: "add your text content here",
            image: "add a URL to an image here, have to have either this, a video, or both!",
            video: "add a !!!&lt;embed&gt;!!! URL to a YouTube video here, have to have either this, an image, or both!"
        });
    },

    defaultMessage : function(messageContent) {
        var currentUser = this.getUser();
        return firebaseData.autoCompleteData({
            from: currentUser ? currentUser.uid : 'unknown',
            from_name: currentUser ? currentUser.displayName : 'unknown',
            message: sanitizeHTML(messageContent),
            is_read: false,
        });
    },

    defaultAdminMessage : function(messageContent) {
        var currentUser = this.getUser();
        return firebaseData.autoCompleteData({
            from: currentUser ? currentUser.uid : 'unknown',
            from_name: currentUser ? currentUser.displayName : 'unknown',
            from_email: currentUser ? currentUser.email : 'unknown',
            message: sanitizeHTML(messageContent),
            is_read: false,
        });
    },

    autoCompleteData : function(docData) {
        // complete the data on this object, first remove spaces and lower case the name for searching
        var wordsArray = []
        if (docData.name) {
            docData.name_lc = firebaseData.lcRef(docData.name);
            // this can be the start of the words
            wordsArray = [docData.name_lc];
        }
        if (docData.email) {
            docData.email_lc = firebaseData.lcRef(docData.email);
            // we can include this in our words too
            wordsArray.push(docData.email_lc);
        }
        if (docData.reference) {
            docData.reference_lc = firebaseData.lcRef(docData.reference);
            // we can include this in our words too
            wordsArray.push(docData.reference_lc);
        }
        // now concatenate all the entries into an array of words to use
        if (docData.name) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.name));
        }
        if (docData.user_email) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.user_email));
        }
        if (docData.user_name) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.user_name));
        }
        if (wordsArray.length > 0) {
            // set this data
            docData.words = wordsArray;
        }
        // add the last update performed
        var currentUser = this.getUser();
        docData.last_update = new Date();
        docData.last_updated_by = currentUser ? currentUser.uid : 'unknown';
        // and return the data
        return docData;
    },

    getUser : function () {
        return firebase.auth().currentUser;
    },

    getUserData : function (user, onSuccess, onFailure) {
        // get the user data from firebase
        if (user && firebase) {
            // get the current UID and get the data in the store for this user
            var userUid = user.uid;
            var fData = this;
            // get the data for the user
            firebase.firestore().collection(this.collectionUsers).doc(userUid).get()
            .then(function(doc) {
                if (doc && doc.exists) {
                    // do stuff with the data
                    onSuccess(doc.data());
                } else {
                    // log this
                    console.log("No document data exists for user", user);
                    // but let's fix it though
                    var newData = fData.createDefaultUserData(user);
                    onSuccess(newData);
                }
            })
            .catch(function(error) {
                onFailure ? onFailure(error) : console.log("Failed to get the document: ", error);
            });
        }
        else {
            // no firebase
            return null;
        }
    },

    createDefaultUserData : function (user) {
        firebase.firestore().collection(this.collectionUsers).doc(user.uid).set(this.newUser(user), {merge: true})
            .then(function() {
                // this worked
                console.log('added user data', user);
            })
            .catch(function(error) {
                // failed
                console.log("failed to create the user data", error);
            });
        return newUserData;
    },

    getUserProfiles : function (user) {
        user.providerData.forEach(function (profile) {
            console.log("Sign-in provider: " + profile.providerId);
            console.log("  Provider-specific UID: " + profile.uid);
            console.log("  Name: " + profile.displayName);
            console.log("  Email: " + profile.email);
            console.log("  Photo URL: " + profile.photoURL);
        });
    },

    updateUserData : function (user, userData, onSuccess, onFailure) {
        firebase.firestore().collection(this.collectionUsers).doc(user.uid).update(userData)
        .then(function() {
            // this worked
            onSuccess ? onSuccess() : null;
        })
        .catch(function(error) {
            // this failed
            onFailure ? onFailure(error) : console.log("Failed to update the document: ", error);
        });
    },

    deleteAllUserData : function(user, onSuccess, onFailure) {
        // delete all the location shared
        this.deleteUserShareLocations(user, null,
            function() {
                // yey
            },
            function(error) {
                // oops
                console.log("Failed to delete a shared location for a deleted user account", error);
            });
        // get all the user's friends in the collection and delete them all
        var batch = firebase.firestore().batch();
        var collectionRef = firebaseData.collectionUsers + '/' + user.uid + '/' + firebaseData.collectionUserFriends;
        firebase.firestore().collection(collectionRef).listDocuments().then(val => {
            val.map((val) => {
                batch.delete(val)
            })
            batch.commit()
        });
        // get all the user's messages in the collection and delete them all
        var batch = firebase.firestore().batch();
        var collectionRef = firebaseData.collectionUsers + '/' + user.uid + '/' + firebaseData.collectionUserMessages;
        firebase.firestore().collection(collectionRef).listDocuments().then(val => {
            val.map((val) => {
                batch.delete(val)
            })
            batch.commit()
        });
        // and delete the user document we have stored
        firebase.firestore().collection(this.collectionUsers).doc(user.uid).delete().then(function() {
            logout();
        }).catch(function(error) {
            alert("Sorry about this, but there was some error in removing all your data, please contact us to confirm all you data was in-fact removed. Please reference this weird set of letters to help us find it: '" + user.uid + "'." );
            console.error("Error removing document: ", error);
        });
    },
    
    checkDataExpiryDate : function(firebaseUserData, dataTitle) {
        if (firebaseUserData) {
            var date = firebaseUserData[dataTitle];
            if (date == null || date.toDate().getTime() > new Date().getTime()) {
                // there is no expiry, or it hasn't passed, this is active, we are good to go
                return true;
            }
            else {
                // the expiry date has passed
                return false;
            }
        }
        else {
            // no data
            console.log("trying to get if user data without any data")
            return false;
        }
    },
    
    isUserMember : function(firebaseUserData) {
        return this.checkDataExpiryDate(firebaseUserData, "expiry_member");
    },
    
    isUserCoach : function(firebaseUserData) {
        return this.checkDataExpiryDate(firebaseUserData, "expiry_coach");
    },
    
    isUserAdmin : function(firebaseUserData) {
        return firebaseUserData['isAdmin'];
    },

    sendMessage(destinationUid, messageContent, onSuccess, onFailure) {
        if (messageContent) {
            firebase.firestore()
                .collection(firebaseData.collectionUsers)
                .doc(destinationUid)
                .collection(firebaseData.collectionUserMessages)
                .add(this.defaultMessage(messageContent))
                .then(function(newDocRef) {
                    // this worked
                    onSuccess ?  onSuccess(newDocRef) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
                });
        }
        else {
            onFailure ? onFailure(error) : console.log("Not letting them send an empty message");
        }
    },
    
    getUserMessages : function(userRef, lastMessage, onSuccess, onFailure) {
        var collectionRef = firebaseData.collectionUsers + '/' + userRef + '/' + firebaseData.collectionUserMessages;
        if (lastMessage) {
            firebase.firestore().collection(collectionRef)
                .orderBy("is_read")
                .orderBy("last_update", 'desc')
                .startAfter(lastMessage)
                .limit(25)
                .get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
        else {
            firebase.firestore().collection(collectionRef)
                .orderBy("is_read")
                .orderBy("last_update", 'desc')
                .limit(25)
                .get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
    },

    deleteUserMessage : function(userRef, messageDataRef, onSuccess, onFailure) {
        var collectionRef = firebaseData.collectionUsers + '/' + userRef + '/' + firebaseData.collectionUserMessages;
        firebase.firestore().collection(collectionRef).doc(messageDataRef).delete()
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);
            });
    },

    readUserMessage : function(userRef, messageDataRef, isRead, onSuccess, onFailure) {
        var collectionRef = firebaseData.collectionUsers + '/' + userRef + '/' + firebaseData.collectionUserMessages;
        firebase.firestore().collection(collectionRef).doc(messageDataRef).update({is_read : isRead})
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to update the document: ", error);
            });
    },

    sendAdminMessage(messageContent, onSuccess, onFailure) {
        if (messageContent) {
            firebase.firestore()
                .collection(firebaseData.collectionAdminMessages)
                .add(this.defaultAdminMessage(messageContent))
                .then(function(newDocRef) {
                    // this worked
                    onSuccess ?  onSuccess(newDocRef) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
                });
            }
        else {
            onFailure ? onFailure(error) : console.log("Not letting them send an empty message");
        }
    },
    
    getAdminMessages : function(lastMessage, onSuccess, onFailure) {
        if (lastMessage) {
            firebase.firestore().collection(firebaseData.collectionAdminMessages)
                .orderBy("is_read")
                .orderBy("last_update", 'desc')
                .startAfter(lastMessage)
                .limit(25)
                .get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
        else {
            firebase.firestore().collection(firebaseData.collectionAdminMessages)
                .orderBy("is_read")
                .orderBy("last_update", 'desc')
                .limit(25)
                .get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
    },

    deleteAdminMessage : function(messageDataRef, onSuccess, onFailure) {
        firebase.firestore().collection(firebaseData.collectionAdminMessages).doc(messageDataRef).delete()
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);
            });
    },

    readAdminMessage : function(messageDataRef, isRead, onSuccess, onFailure) {
        firebase.firestore().collection(firebaseData.collectionAdminMessages).doc(messageDataRef).update({is_read : isRead})
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to update the document: ", error);
            });
    },

    addUserFriend : function(userRef, friendData, onSuccess, onFailure) {
        firebase.firestore()
            .collection(firebaseData.collectionUsers)
            .doc(userRef)
            .collection(firebaseData.collectionUserFriends)
            .add(friendData)
            .then(function(newDocRef) {
                // this worked
                onSuccess ?  onSuccess(newDocRef) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
            });
    },
    
    getUserFriends : function(userRef, lastFriend, onSuccess, onFailure) {
        var collectionRef = firebaseData.collectionUsers + '/' + userRef + '/' + firebaseData.collectionUserFriends;
        if (lastFriend) {
            firebase.firestore().collection(collectionRef)
                .orderBy("last_update", 'desc')
                .startAfter(lastFriend)
                .limit(9)
                .get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
        else {
            firebase.firestore().collection(collectionRef)
                .orderBy("last_update", 'desc')
                .limit(9)
                .get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
    },
    
    getUserFriend : function(userRef, friendUid, onSuccess, onFailure) {
        var collectionRef = firebaseData.collectionUsers + '/' + userRef + '/' + firebaseData.collectionUserFriends;
        // find the friend data that matches the UID of the friend we are looking for
        firebase.firestore().collection(collectionRef).where("user_uid", "==", friendUid).get()
            .then(function(querySnapshot) {
                // this worked
                onSuccess ?  onSuccess(querySnapshot) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
            });
    },

    updateUserFriend : function(userRef, friendDataRef, locationUid, locationData, onSuccess, onFailure) {
        var collectionRef = firebaseData.collectionUsers + '/' + userRef + '/' + firebaseData.collectionUserFriends;
        firebase.firestore().collection(collectionRef).doc(friendDataRef)
            .set(this.defaultFriend(locationUid, locationData))
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to set the document data: ", error);
            });
    },

    deleteUserFriend : function(userRef, friendDataRef, onSuccess, onFailure) {
        var collectionRef = firebaseData.collectionUsers + '/' + userRef + '/' + firebaseData.collectionUserFriends;
        firebase.firestore().collection(collectionRef).doc(friendDataRef).delete()
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);
            });
    },

    /*
    /// The merge of the name into the plan is unreliable (duplicate names don't work) so have removed this
    addLessonToCollection : function(lessonCollection, lessonPlan, onSuccess, onFailure) {
        var db = firebase.firestore();
        db.collection(lessonCollection).add({
            name: "New Lesson",
            subtitle: "A newly added lesson just now"
        })
        .then(function(newDocRef) {
            // this worked
            if (onSuccess) {
                onSuccess(newDocRef);
            }
        })
        .catch(function(error) {
            if (onFailure) {
                onFailure(error);
            }
            else {
                console.log("Failed to add the document: ", error);
            }
        });
    },*/

    addLessonToCollection : function(lessonCollection, onSuccess, onFailure) {
        firebase.firestore().collection(lessonCollection).add(this.defaultLesson())
            .then(function(newDocRef) {
                // this worked
                onSuccess ?  onSuccess(newDocRef) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
            });
    },

    deleteLesson : function(lessonCollection, lessonRef, onSuccess, onFailure) {
        // firestore does not delete child collections by default, we have to do that ourselves then...
        var dataParent = this;
        this.getLessonSections(true, lessonCollection, lessonRef,
            function(querySnapshot) {
                // for each section, delete each one
                querySnapshot.forEach(function (doc) {
                    dataParent.deleteLessonSection(lessonCollection, lessonRef, doc.id, 
                        function() {
                            // deleted, sweet...
                        },
                        function(error) {
                            // error deleting child
                            onFailure ? onFailure(error) : console.log("Failed to delete the child document: ", error);
                        });
                });
                // now we have deleted all the sections, we can delete the parent lesson
                firebase.firestore().collection(lessonCollection).doc(lessonRef).delete()
                    .then(function() {
                        // this worked
                        onSuccess ?  onSuccess() : null;
                    })
                    .catch(function(error) {
                        // this didn't work
                        onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);
                    });
            },
            function(error) {
                onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);    
            });  
    },

    getLesson : function(lessonCollection, lesson, onSuccess, onFailure) {
        firebase.firestore().collection(lessonCollection).doc(lesson).get()
            .then(function(doc) {
                // this worked
                onSuccess ?  onSuccess(doc) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get the document: ", error);
            });
    },

    setLesson : function(lessonCollection, lessonRef, lessonData, onSuccess, onFailure) {
        firebase.firestore().collection(lessonCollection).doc(lessonRef).set(lessonData)
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to set the document data: ", error);
            });
    },

    addLessonSection : function(lessonCollection, lessonRef, onSuccess, onFailure) {
        firebase.firestore().collection(lessonCollection).doc(lessonRef).collection(firebaseData.collectionLessonContents).add(this.defaultLessonSection())
            .then(function(newDocRef) {
                // this worked
                onSuccess ?  onSuccess(newDocRef) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
            });
    },
    
    getLessonSections : function(isIncludeZeroPriority, lessonCollection, lessonRef, onSuccess, onFailure) {
        var collectionRef = lessonCollection + '/' + lessonRef + '/' + firebaseData.collectionLessonContents;
        if (!isIncludeZeroPriority) {
            // just get ones that are not zero priority - standard as this means 'hidden'
            firebase.firestore().collection(collectionRef).where("priority", ">", 0).orderBy("priority").get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
        else {
            // get them all
            firebase.firestore().collection(collectionRef).orderBy("priority").get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
    },

    setLessonSection : function(lessonCollection, lessonRef, sectionRef, sectionData, onSuccess, onFailure) {
        var collectionRef = lessonCollection + '/' + lessonRef + '/' + firebaseData.collectionLessonContents
        firebase.firestore().collection(collectionRef).doc(sectionRef).set(sectionData)
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to set the document data: ", error);
            });
    },

    deleteLessonSection : function(lessonCollection, lessonRef, sectionRef, onSuccess, onFailure) {
        var collectionRef = lessonCollection + '/' + lessonRef + '/' + firebaseData.collectionLessonContents
        firebase.firestore().collection(collectionRef).doc(sectionRef).delete()
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);
            });
    },

    getLessonPlan : function(lessonPlan, onSuccess, onFailure) {
        // get the data for the user - get the lesson plan
        firebase.firestore().collection(this.collectionLessonPlans).doc(lessonPlan).get()
            .then(function(doc) {
                // this worked
                onSuccess ?  onSuccess(doc) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get the document: ", error);
            });
    },

    getCollectionLessons : function(isIncludeZeroPriority, lessonCollection, onSuccess, onFailure) {
        // get all the lessons in the collection, are we to include zero?
        if (!isIncludeZeroPriority) {
            // just get ones that are not zero priority - standard as this means 'hidden'
            firebase.firestore().collection(lessonCollection).where("priority", ">", 0).orderBy("priority").get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
        else {
            // get them all
            firebase.firestore().collection(lessonCollection).orderBy("priority").get()
                .then(function(querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
                });
        }
    },

    setLessonPlan : function(lessonPlanRef, lessonsRefs, lessonsNames, onSuccess, onFailure) {
        // construct the lesson plan properly
        var lessonData = {};
        lessonData['lessons'] = lessonsRefs;
        lessonData['lessons_names'] = lessonsNames;
        // send this to firestore to replace the plan
        firebase.firestore().collection('lesson_plans').doc(lessonPlanRef).set(lessonData)
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to set the document data: ", error);
            });
    },

    getUserShareLocations : function(user, onSuccess, onFailure) {
        // get all the locations this user is sharing right now
        firebase.firestore().collection('locations').where("user_uid", "==", user.uid).orderBy("reference").get()
            .then(function(querySnapshot) {
                // this worked
                onSuccess ?  onSuccess(querySnapshot) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
            });
    },

    deleteUserShareLocations : function(user, type, onSuccess, onFailure) {
        // get all the locations this user is sharing right now
        var dataParent = this;
        this.getUserShareLocations(user,
            function(querySnapshot) {
                // now we have them all, delete them all please
                querySnapshot.forEach(function (doc) {
                    // for each document, delete the document (if the correct type)
                    if (!type || type === doc.data()['type']) {
                        // this is the correct type to delete, delete it
                        dataParent.deleteUserShareLocation(doc.id, 
                            function() {
                                // deleted, sweet...
                            },
                            function(error) {
                                // error deleting child
                                onFailure ? onFailure(error) : console.log("Failed to delete the child location: ", error);
                            });
                        }
                });
                onSuccess ?  onSuccess() : null;
            },
            function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
            });
    },

    deleteUserShareLocation : function(locationRef, onSuccess, onFailure) {
        // get all the locations this user is sharing right now
        firebase.firestore().collection(this.collectionLocations).doc(locationRef).delete()
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
            });
    },

    setUserShareLocation : function(locationRef, locationData, onSuccess, onFailure) {
        firebase.firestore().collection(this.collectionLocations).doc(locationRef).set(locationData)
            .then(function() {
                // this worked
                onSuccess ?  onSuccess() : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to set the document data: ", error);
            });
    },

    addUserShareLocation : function(locationData, onSuccess, onFailure) {
        firebase.firestore().collection(this.collectionLocations).add(locationData)
            .then(function(newDocRef) {
                // this worked
                onSuccess ?  onSuccess(newDocRef) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
            });
    },

    getCurrentGeoLocation : function(onSuccess, onFailure) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                onSuccess(position);
            });
        } else if (onFailure) {
            onFailure("Geolocation is not supported by this browser.");
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    },

    searchCollectionForMatch : function (collectionName, entryTitle, searchTerm, startAfter, onSuccess, onFailure) {
        if (startAfter) {
            firebase.firestore().collection(collectionName)
                .where(entryTitle, '==', firebaseData.lcRef(searchTerm))
                .startAfter(startAfter)
                .limit(25)
                .get()
                .then(function (querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to find any matching documents: ", error);
                });
        }
        else {
            firebase.firestore().collection(collectionName)
                .where(entryTitle, '==', firebaseData.lcRef(searchTerm))
                .limit(25)
                .get()
                .then(function (querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to find any matching documents: ", error);
                });
        }
    },

    searchCollectionForWord : function (collectionName, searchTerm, startAfter, onSuccess, onFailure) {
        if (startAfter) {
            firebase.firestore().collection(collectionName)
                .where("words", 'array-contains', firebaseData.lcRef(searchTerm))
                .startAfter(startAfter)
                .limit(25)
                .get()
                .then(function (querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to find any matching documents: ", error);
                });
        }
        else {
            firebase.firestore().collection(collectionName)
                .where("words", 'array-contains', firebaseData.lcRef(searchTerm))
                .limit(25)
                .get()
                .then(function (querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to find any matching documents: ", error);
                });
        }
    },
};