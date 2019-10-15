function signinFirebase() {
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
                var signIn = document.getElementById('firebaseSignIn');
                if (signIn) {
                    signIn.style.display = 'none';
                }
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
    document.getElementById('firebase_login_container').style.display = null;

    // Initialize the FirebaseUI Widget using Firebase.
    if(firebaseui.auth.AuthUI.getInstance()) {
        const ui = firebaseui.auth.AuthUI.getInstance();
        ui.start('#firebase_login_container', uiConfig);
    } else {
        const ui = new firebaseui.auth.AuthUI(firebase.auth());
        ui.start('#firebase_login_container', uiConfig);	
    }
}

function updateFirebaseUserDisplay(user) {
    // update the dispay according the user being logged on or not
    var signIn = document.getElementById('firebaseSignIn');
    var signedIn = document.getElementById('firebaseSignedIn');
    if (signIn && signedIn) {
        if (user) {
            // User is signed in.
            signIn.style.display = 'none';
            signedIn.style.display = null;
            signedIn.innerHTML  = '<a href="profile.html">' + user.displayName + '</a>';
            console.log('user ' + user.displayName + " logged in");
        } else {
            // No user is signed in.
            signIn.style.display = null;
            signedIn.style.display = 'none';
            console.log('no user logged in');
        }
    }
    // update user role details
    updateFirebaseUserItems(user);
}

function initialiseFirebaseLoginButton() {
    // setup the login button properly
    var signIn = document.getElementById('firebaseSignIn');
    var signedIn = document.getElementById('firebaseSignedIn');
    if (signIn && signedIn) {
        signIn.style.display = 'none';
        signedIn.style.display = 'none';
        firebase.auth().onAuthStateChanged(function(user) {
            // update the display of the user here
            updateFirebaseUserDisplay(user);
            // dispatch this change to the document
            document.dispatchEvent(new Event('firebaseuserchange'));
        });
        signIn.onclick = signinFirebase;
    }
};

function showFirebaseLoginButtons(user, userData) {
    var coachingItems = document.getElementsByClassName("menu_coaching");
    var isCoach = firebaseData.isUserCoach(userData);
    for (var i = 0; i < coachingItems.length; i++) {
        if (isCoach) {
            coachingItems[i].style.display = null;
        }
        else {
            coachingItems[i].style.display = 'none';
        }
    }
    // and admin if we are admin
    var adminItems = document.getElementsByClassName("menu_admin");
    var isAdmin = firebaseData.isUserAdmin(userData);
    for (var i = 0; i < adminItems.length; i++) {
        if (isAdmin) {
            adminItems[i].style.display = null;
        }
        else {
            adminItems[i].style.display = 'none';
        }
    }
}

function removeFirebaseLoginButtons() {
    // remove all the coaching options
    var coachingItems = document.getElementsByClassName("menu_coaching");
    for (var i = 0; i < coachingItems.length; i++) {
        coachingItems[i].style.display = 'none';
    }
    // remove all the admin options
    var adminItems = document.getElementsByClassName("menu_admin");
    for (var i = 0; i < adminItems.length; i++) {
        adminItems[i].style.display = 'none';
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

const firebaseData = {
    getUser : function () {
        return firebase.auth().currentUser;
    },

    getUserData : function (user, onSuccess, onFailure) {
        // get the user data from firebase
        if (user && firebase) {
            // get the current UID and get the data in the store for this user
            var userUid = user.uid;
            // get the data for the user
            firebase.firestore().collection('users').doc(userUid).get()
            .then(function(doc) {
                if (doc && doc.exists) {
                    // do stuff with the data
                    onSuccess(doc.data());
                } else if (onFailure) {
                    // report this
                    onFailure("No document data exists for " + docRef);
                }
                else {
                    // doc.data() will be undefined in this case
                    console.log("No document data exists for " + docRef);
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
        firebase.firestore().collection("users").doc(user.uid).update(userData)
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
        this.deleteUserShareLocations(user, 
            function() {
                // yey
            },
            function(error) {
                // oops
                console.log("Failed to delete a shared location for a deleted user account", error);
            });
        
        // and delete the user document we have stored
        firebase.firestore().collection("users").doc(user.uid).delete().then(function() {
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
        firebase.firestore().collection(lessonCollection).add({
            name: "New Lesson",
            subtitle: "A newly added lesson just now",
            priority: 0,
            progress_options: ""
        })
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
        firebase.firestore().collection(lessonCollection).doc(lessonRef).collection('contents').add({
            title: "New Section",
            priority: 0,
            subtitle: "A newly added section just now",
            text: "add your text content here",
            image: "add a URL to an image here, have to have either this, a video, or both!",
            video: "add a !!!&lt;embed&gt;!!! URL to a YouTube video here, have to have either this, an image, or both!"
        })
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
        var collectionRef = lessonCollection + '/' + lessonRef + '/contents';
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
        var collectionRef = lessonCollection + '/' + lessonRef + '/contents'
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
        var collectionRef = lessonCollection + '/' + lessonRef + '/contents'
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
        firebase.firestore().collection('lesson_plans').doc(lessonPlan).get()
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

    deleteUserShareLocations : function(user, onSuccess, onFailure) {
        // get all the locations this user is sharing right now
        var dataParent = this;
        this.getUserShareLocations(user, 
            function(querySnapshot) {
                // now we have them all, delete them all please
                querySnapshot.forEach(function (doc) {
                    // for each document, delete the document
                    dataParent.deleteUserShareLocation(doc.id, 
                        function() {
                            // deleted, sweet...
                        },
                        function(error) {
                            // error deleting child
                            onFailure ? onFailure(error) : console.log("Failed to delete the child location: ", error);
                        });
                });
            },
            function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
            });
    },

    deleteUserShareLocation : function(locationRef, onSuccess, onFailure) {
        // get all the locations this user is sharing right now
        firebase.firestore().collection('locations').doc(locationRef).delete()
        .then(function(querySnapshot) {
            // this worked
            onSuccess ?  onSuccess(querySnapshot) : null;
        })
        .catch(function(error) {
            // this didn't work
            onFailure ? onFailure(error) : console.log("Failed to get the collection documents: ", error);
        });
    },

    setUserShareLocation : function(locationRef, locationData, onSuccess, onFailure) {
        firebase.firestore().collection('locations').doc(locationRef).set(locationData)
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
        firebase.firestore().collection('locations').add(locationData)
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
};