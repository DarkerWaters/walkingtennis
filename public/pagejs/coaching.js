var currentLessonRef;

function displayCoachingData(user) {
    // show all the coaching data now, first hide the warning that you are not a coach
    document.getElementById('not_logged_in').style.display = 'none';
    document.getElementById('not_a_coach').style.display = 'none';
                
    // now get all the lessons and show them all here
    var lessonsDiv = document.getElementById('lessons');
    // populate this div with the lessons from firebase
    var db = firebase.firestore();
    // get the data for the user
    const docRef = db.collection('lesson_plans').doc('coaching')
    docRef.get().then(function(doc) {
        if (doc.exists) {
            // do stuff with the data
            displayLessonPlan(lessonsDiv, doc.data());   
        } else {
            // error
            lessonsDiv.innerHTML = 'failed to find the lesson plan, sorry...';
        }
        // show the result
        lessonsDiv.style.display = null;
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}

function hideCoachingData(user) {
    // hide all the coaching data
    document.getElementById('lessons').style.display = 'none';
    if (user) {
        // have a user, but not a coach, tell them to upgrade
        document.getElementById('not_logged_in').style.display = 'none';
        document.getElementById('not_a_coach').style.display = null;
    }
    else {
        // we are not logged in, ask the user to log in
        document.getElementById('not_logged_in').style.display = null;
        document.getElementById('not_a_coach').style.display = 'none';
    }
    // remove everything from the lesson plan div
    var lessonsDiv = document.getElementById('lessons');
    var child = lessonsDiv.lastElementChild;  
    while (child) { 
        lessonsDiv.removeChild(child); 
        child = lessonsDiv.lastElementChild; 
    }
}

function displayLessonPlan(lessonsDiv, data) {
    // remove everything from the div
    var child = lessonsDiv.lastElementChild;  
    while (child) { 
        lessonsDiv.removeChild(child); 
        child = lessonsDiv.lastElementChild; 
    }
    // find the templates to use
    var templateLessonContainer = document.getElementById('template-lesson-container');

    // and put the lessons back in
    var lessonRefs = data['lessons'];
    var lessonNames = data['lessons_names'];
    for (var i = 0; i < lessonRefs.length; ++i) {
        var lessonRef = lessonRefs[i].id;
        var lessonName = "Lesson " + (i + 1);
        if (i < lessonNames.length) {
            lessonName = lessonNames[i];
        }
        // create the button container - all included
        var lessonContainer = templateLessonContainer.cloneNode(true);
        // without the ID (won't be unique)
        lessonContainer.id = lessonRef + 'container';
        // and put this container into the document and remember the one added
        lessonContainer = lessonsDiv.appendChild(lessonContainer);
        
        // this container contains the button, find the button
        var lessonButton = lessonContainer.querySelector('#template-lesson-button');
        // and set the ID and the name properly
        lessonButton.id = lessonRef;
        lessonButton.innerHTML = lessonName;
        lessonButton.setAttribute("onClick", "onClickLesson('" + lessonRef + "')");
        // reveal the whole container
        lessonContainer.style.display = null;
    }

    // get the last lesson the user accessed and select this if we can
    var user = getFirebaseUser();
    if (user) {
        // there is a user, get the data
        getFirebaseUserData(user, function(userData) {
            // we have the data, is there a last 'coaching_lesson' reference
            if (userData) {
                var lessonRef = userData['last_coaching_lesson'];
                if (lessonRef) {
                    // have one, select this button
                    showLessonContent(lessonRef, userData);
                }
            }
        },
        function() {
            // failed to get the data, this is ok - it will just not have one selected
            console.log("there is no last lesson to select by default");
        })
    }
}

function setLessonProgress(progress) {
    // set the progress of this lesson
    showLessonProgress(progress);
    // set the progress of the currently active lesson to the specified progress
    if (currentLessonRef) {
        var user = getFirebaseUser();
        if (user) {
            // there is a user, this is the document we want to change
            var userRef = firebase.firestore().collection("users").doc(user.uid);
            // update the progress for this lesson
            var variableName = 'progress_' + currentLessonRef;
            var usersUpdate = {};
            usersUpdate[variableName] = progress;
            return userRef.update(usersUpdate).then(function() {
                // cool
            })
            .catch(function(error) {
                // something wrong
                console.error("Error updating lesson progress: ", error);
            });
        }
    }
    else {
        // no current lesson to set
        console.log("no lesson selected to set")
    }
}

function showLessonProgress(progress) {
    // find the button that represents this progress level and select it
    
    // remove the 'special' from any currently pressed buttons
    var buttons = document.getElementsByClassName("lesson_progress_selector");
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].id === 'lesson_progress_' + progress) {
            // this is the special one (it's id is the lesson_progress_1 or whatever the progress currently is)
            buttons[i].classList.add("special");
        }
        else {
            // this is not the clicked on
            buttons[i].classList.remove("special");
        }
    }

    document.getElementById('progress_display').value = progress;
}

function onClickLesson(lessonRef) {
    // they clicked a button then, show the content
    // this needs the user data while we are here
    var user = getFirebaseUser();
    if (user) {
        // there is a user, get the data
        getFirebaseUserData(user, function(userData) {
            // we have the data, is there a last 'coaching_lesson' reference
            showLessonContent(lessonRef, userData);
        },
        function() {
            // failed to get the data, this is ok - it will just not have one selected
            showLessonContent(lessonRef, null);
        });
    }
    else {
        // no user, doesn't mean we can't show the content
        showLessonContent(lessonRef, null);
    }
}

function showLessonContent(lessonRef, userData) {
    // remember this reference to the currently selected lesson
    currentLessonRef = lessonRef;
    // remove the 'special' from any currently pressed buttons
    var buttons = document.getElementsByClassName("lesson_selector");
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].id === lessonRef) {
            // this is the special one
            buttons[i].classList.add("special");
        }
        else {
            // this is not the clicked on
            buttons[i].classList.remove("special");
        }
    }
    removeLessonContent();

    // if we have user data then we can show the progress of this lesson
    showLessonProgress(userData['progress_' + lessonRef]);

    // populate the div with the lesson content from firebase
    var db = firebase.firestore();
    // get the data for the user
    const docRef = db.collection('coaching_lessons').doc(lessonRef)
    docRef.get().then(function(doc) {
        if (doc.exists) {
            // show this lesson content
            displayLessonContent(doc.data());
        } else {
            // error
            removeLessonContent();
            document.getElementById('lesson_content').innerHTML = "Sorry, couldn't find a lesson for " + lessonRef;
        }
    }).catch(function(error) {
        removeLessonContent();
        console.log("Error getting document:", error);
    });
}

function displayLessonContent(lessonData) {
    removeLessonContent()
    var lessonContent = document.getElementById('lesson_content');
    document.getElementById('lesson_name').innerHTML = lessonData['name'];
    document.getElementById('lesson_content').style.display = null;
}

function removeLessonContent() {
    document.getElementById('lesson_content').style.display = 'none';
}

// need to manage the data in this page
function populateUserData() {
    var user = getFirebaseUser();
    if (user) {
        // we are logged in
        displayCoachingData(user);
        // get the user data from firebase here
        getFirebaseUserData(user, function(data) {
            // we have the user data here, set the data correcly
            if (isFirebaseUserCoach(data)) {
                // we are a coach
                displayCoachingData(user);
            }
            else {
                // we are not a coach
                hideCoachingData(user);
            }
        }, function() {
            // this is the failure to get the data, do our best I suppose
            hideCoachingData(user);
            console.log("Failed to get the firestore user data for " + user);
        });
    }
    else {
        // we are not logged in, ask the user to log in
        hideCoachingData(user);
    }
};

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});