var currentLessonRef;

var activeLessonCollection = 'lessons';
var activeLessonPlan = 'everyone';

function setLessonPlan(lessonPlan, collectionName) {
    activeLessonPlan = lessonPlan;
    activeLessonCollection = collectionName;
    removeLessonContent();

    var user = getFirebaseUser();
    if (user) {
        // we are logged in
        displayAdminData(user);
    }
    else {
        hideAdminData();
    }
}

function addLessonToPlan() {
    // add a new lesson to the current plan
    var lessonName = document.getElementById('lesson_plan_entry_name').value;

    // create a new lesson
    firebase.firestore().collection(activeLessonCollection).add({
        name: "New Lesson",
        subtitle: "A newly added lesson just now"
    })
    .then(function(newDocRef) {
        // this worked, need to update the lesson plan to point to this
        var planRef = firebase.firestore().collection("lesson_plans").doc(activeLessonPlan);
        // update the array of lessons available in this plan - add another
        var usersUpdate = {};
        usersUpdate['lessons'] = firebase.firestore.FieldValue.arrayUnion(newDocRef);
        usersUpdate['lessons_names'] = firebase.firestore.FieldValue.arrayUnion(lessonName);
        return planRef.update(usersUpdate).then(function() {
            // cool, this worked well - refresh the page
            setLessonPlan(activeLessonPlan, activeLessonCollection);
        })
        .catch(function(error) {
            // something wrong
            console.error("Error updating lesson progress: ", error);
        });
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
    });
}

function addLessonToCollection() {
    // add a new lesson to the current plan
    firebase.firestore().collection(activeLessonCollection).add({
        name: "New Lesson",
        subtitle: "A newly added lesson just now"
    })
    .then(function(newDocRef) {
        // refresh the page
        setLessonPlan(activeLessonPlan, activeLessonCollection);
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
    });
}

function displayAdminData(user) {
    // show all the Admin data now, first hide the warning that you are not an admin user
    document.getElementById('not_logged_in').style.display = 'none';
    document.getElementById('not_a_admin').style.display = 'none';
                
    // now get all the lessons and show them all here - just doing lessons ATM as don't know about coa
    var lessonsDiv = document.getElementById('lessons');
    // populate this div with the lessons from firebase
    var db = firebase.firestore();

    /*
    // get the data for the user - get the lesson plan
    const docRef = db.collection('lesson_plans').doc(activeLessonPlan)
    docRef.get().then(function(doc) {
        if (doc.exists) {
            // do stuff with the data
            displayLessonPlan(lessonsDiv, doc.data());
        } else {
            // error
            lessonsDiv.innerHTML = 'failed to find the lesson plan, sorry...';
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
    */
   // get all the lessons in the collection
   db.collection(activeLessonCollection).get().then(
       function(querySnapshot) {
            // clear all the current lessons
            var child = lessonsDiv.lastElementChild;  
            while (child) { 
                lessonsDiv.removeChild(child); 
                child = lessonsDiv.lastElementChild; 
            }
            // and put each lesson found back in
            querySnapshot.forEach(function(doc) {
                // doc.data() is never undefined for query doc snapshots
                createLessonButton(lessonsDiv, doc.id, doc.data()['name']);
            });
            // show the result
            lessonsDiv.style.display = null;
        }
    );
}

function hideAdminData(user) {
    // hide all the Admin data
    document.getElementById('lessons').style.display = 'none';
    if (user) {
        // have a user, but not a coach, tell them to upgrade
        document.getElementById('not_logged_in').style.display = 'none';
        document.getElementById('not_a_admin').style.display = null;
    }
    else {
        // we are not logged in, ask the user to log in
        document.getElementById('not_logged_in').style.display = null;
        document.getElementById('not_a_admin').style.display = 'none';
    }
    // remove everything from the lesson plan div
    var lessonsDiv = document.getElementById('lessons');
    var child = lessonsDiv.lastElementChild;  
    while (child) { 
        lessonsDiv.removeChild(child); 
        child = lessonsDiv.lastElementChild; 
    }
    removeLessonContent();
}

function displayLessonPlan(lessonsDiv, data) {
    // remove everything from the div
    var child = lessonsDiv.lastElementChild;  
    while (child) { 
        lessonsDiv.removeChild(child); 
        child = lessonsDiv.lastElementChild; 
    }
    // and put the lessons back in
    var lessonRefs = data['lessons'];
    var lessonNames = data['lessons_names'];
    for (var i = 0; i < lessonRefs.length; ++i) {
        var lessonRef = lessonRefs[i].id;
        var lessonName = "Lesson " + (i + 1);
        if (i < lessonNames.length) {
            lessonName = lessonNames[i];
        }
        createLessonButton(lessonsDiv, lessonRef, lessonName);
    }
}

function createLessonButton(lessonsDiv, lessonRef, lessonName) {
    // create the button container - all included
    var templateLessonContainer = document.getElementById('template-lesson-container');
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

function onClickLesson(lessonRef) {
    // they clicked a button then, show the content
    showLessonContent(lessonRef);
}

function showLessonContent(lessonRef) {
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

    // populate the div with the lesson content from firebase
    var db = firebase.firestore();
    // get the data for the user
    const docRef = db.collection(activeLessonCollection).doc(lessonRef)
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
    document.getElementById('lesson_ref_title').innerHTML = currentLessonRef;
    document.getElementById('name').value = lessonData['name'];
    document.getElementById('subtitle').value = lessonData['subtitle'];
    

    var progressOptions = lessonData['progress_options'];
    document.getElementById('progress_options').value = progressOptions;
    if (progressOptions) {
        // show the progress options
        
        var optionsArray = progressOptions.split(',');
        for (var i = 0; i < optionsArray.length; ++i) {
            // for each option, create the fields to edit the option
            var settingsArray = optionsArray[i].split(':');
            
        }
    }

    // and show it
    lessonContent.style.display = null;
}

function removeLessonContent() {
    document.getElementById('lesson_content').style.display = 'none';
}

// need to manage the data in this page
function populateUserData() {
    var user = getFirebaseUser();
    if (user) {
        // we are logged in
        displayAdminData(user);
        // get the user data from firebase here
        getFirebaseUserData(user, function(data) {
            // we have the user data here, set the data correcly
            if (isFirebaseUserAdmin(data)) {
                // we are a coach
                displayAdminData(user);
            }
            else {
                // we are not a coach
                hideAdminData(user);
            }
        }, function() {
            // this is the failure to get the data, do our best I suppose
            hideAdminData(user);
            console.log("Failed to get the firestore user data for " + user);
        });
    }
    else {
        // we are not logged in, ask the user to log in
        hideAdminData(user);
    }
};

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});