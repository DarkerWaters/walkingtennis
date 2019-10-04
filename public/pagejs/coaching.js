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
    var templateLessonButton = document.getElementById('template-lesson-button');
    // and put the lessons back in
    var lessonRefs = data['lessons'];
    var lessonNames = data['lessons_names'];
    for (var i = 0; i < lessonRefs.length; ++i) {
        var lessonRef = lessonRefs[i].id;
        var lessonName = "Lesson " + (i + 1);
        if (i < lessonNames.length) {
            lessonName = lessonNames[i];
        }
        // create the button
        var lessonButton = templateLessonButton.cloneNode(true);
        lessonButton.id = lessonRef;
        lessonButton.innerHTML = lessonName;
        lessonButton.setAttribute("onClick", "showLessonContent('" + lessonRef + "')");
        // add to the div
        lessonsDiv.appendChild(lessonButton);
    }
}

function showLessonContent(lessonRef) {
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