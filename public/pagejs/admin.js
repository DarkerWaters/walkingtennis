var currentLessonRef;

var activeLessonCollection = 'lessons';
var activeLessonPlan = 'everyone';

var lessonPlanData = {};

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
        subtitle: "A newly added lesson just now",
        priority: 0,
        progress_options: ""
    })
    .then(function(newDocRef) {
        // refresh the page
        setLessonPlan(activeLessonPlan, activeLessonCollection);
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
    });
}

function deleteLessonFromCollection() {
    firebase.firestore().collection(activeLessonCollection).doc(currentLessonRef).delete().then(function() {
        console.log("Document successfully deleted!");
        removeLessonContent();
        populateUserData();
    }).catch(function(error) {
        console.error("Error removing document: ", error);
    });
}

function addLessonSection() {
    // add a new section to the current lesson
    firebase.firestore().collection(activeLessonCollection).doc(currentLessonRef).collection('contents').add({
        title: "New Section",
        priority: 0,
        subtitle: "A newly added section just now",
        text: "add your text content here",
        image: "add a URL to an image here, have to have either this, a video, or both!",
        video: "add a !!!<embed>!!! URL to a YouTube video here, have to have either this, an image, or both!"
    })
    .then(function(newDocRef) {
        // refresh the page
        showLessonSections()
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
    var lessonPlansDiv = document.getElementById('lesson_plan_container');
    // populate this div with the lessons from firebase
    var db = firebase.firestore();

    // get the data for the user - get the lesson plan
    const docRef = db.collection('lesson_plans').doc(activeLessonPlan)
    docRef.get().then(function(doc) {
        if (doc.exists) {
            // do stuff with the data
            displayLessonPlan(lessonPlansDiv, doc.data());
        } else {
            // error
            lessonsDiv.innerHTML = 'failed to find the lesson plan, sorry...';
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
    
    // get all the lessons in the collection
    db.collection(activeLessonCollection).orderBy("priority").get().then(
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

function createLessonPlanFromOrder() {
    // this will overwrite the lesson plan with the collection of lessons, and their ordering
    var db = firebase.firestore();
    db.collection(activeLessonCollection).where("priority", ">", 0).orderBy("priority").get().then(
        function(querySnapshot) {
            // get each lesson in the snapshot, create the lesson plan from this (zero excluded otherwise in order)
            var lessonsRefs = [];
            var lessonsNames = [];
            querySnapshot.forEach(function(doc) {
                // doc.data() is never undefined for query doc snapshots, add the name and the ref to the arrays created
                lessonsRefs.push(db.doc('/' + activeLessonCollection + '/' + doc.id));
                lessonsNames.push(doc.data()['name']);
            });
            var lessonData = {};
            lessonData['lessons'] = lessonsRefs;
            lessonData['lessons_names'] = lessonsNames;
            // send this to firestore to replace the plan
            db.collection('lesson_plans').doc(activeLessonPlan).set(lessonData).then(function() {
                console.log("Document successfully updated");
                displayAdminData();
            }).catch(function(error) {
                console.error("Error removing document: ", error);
            });
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
        createLessonPlanButton(lessonsDiv, lessonRef, lessonName);
    }
}

function createLessonPlanButton(lessonsDiv, lessonRef, lessonName) {
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
    // reveal the button
    lessonContainer.style.display = null;
    // and return the button
    return lessonButton;
}

function createLessonButton(lessonsDiv, lessonRef, lessonName) {
    // create the button container - re-use the lesson plan button
    var lessonButton = createLessonPlanButton(lessonsDiv, lessonRef, lessonName);
    // setup the click on this
    lessonButton.id = 'lesson' + lessonRef;
    lessonButton.setAttribute("onClick", "onClickLesson('" + lessonRef + "')");
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
        if (buttons[i].id === 'lesson' + lessonRef) {
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
    db.collection(activeLessonCollection).doc(lessonRef).get().then(function(doc) {
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

function showLessonSections() {
    // show the sections for the current lesson loaded, first remove old ones
    removeLessonSections();

    // now get them all
    // get all the sections in the lesson
    firebase.firestore().collection(activeLessonCollection + '/' + currentLessonRef + '/contents').orderBy("priority").get().then(
        function (querySnapshot) {
            // we have all the contents of the lesson now, put each content found back in
            var sectionContainer = document.getElementById('lesson_section_container');
            querySnapshot.forEach(function (doc) {
                // doc.data() is never undefined for query doc snapshots
                createLessonContentsDiv(sectionContainer, doc.id, doc.data());
            });
        }
    );
}

function saveLessonToCollection() {
    // get all the data from the page
    var lessonData = {};
    
    lessonData['priority'] = Number(document.getElementById('priority').value);
    lessonData['name'] = document.getElementById('name').value;
    lessonData['subtitle'] = document.getElementById('subtitle').value;
    lessonData['progress_options'] = document.getElementById('progress_options').value;

    firebase.firestore().collection(activeLessonCollection).doc(currentLessonRef).set(lessonData).then(function() {
        console.log("Document successfully updated");
        displayAdminData();
    }).catch(function(error) {
        console.error("Error removing document: ", error);
    });
}

function removeLessonSections() {
    // get the parent for the sections
    var sectionContainer = document.getElementById('lesson_section_container');
    var child = sectionContainer.lastElementChild;  
    while (child) { 
        sectionContainer.removeChild(child); 
        child = sectionContainer.lastElementChild; 
    } 
}

function displayLessonContent(lessonData) {
    removeLessonContent()
    var lessonContent = document.getElementById('lesson_content');
    document.getElementById('lesson_ref_title').innerHTML = 'Lesson ' + currentLessonRef + ' top-level data';
    
    document.getElementById('priority').value = lessonData['priority'];
    document.getElementById('name').value = lessonData['name'];
    document.getElementById('subtitle').value = lessonData['subtitle'];
    

    var progressOptions = lessonData['progress_options'];
    document.getElementById('progress_options').value = progressOptions;
    /*if (progressOptions) {
        // show the progress options individually
        var optionsArray = progressOptions.split(',');
        for (var i = 0; i < optionsArray.length; ++i) {
            // for each option, create the fields to edit the option
            var settingsArray = optionsArray[i].split(':');
        }
    }*/

    // show the sections that are available under this lesson
    showLessonSections();

    // and show it
    lessonContent.style.display = null;
}

function removeLessonContent() {
    document.getElementById('lesson_content').style.display = 'none';
}

function createLessonContentsDiv(contentsContainer, contentsRef, contents) {
    // find the template and copy it to the contentsContainer before populating the relevant data
    var contentsDiv = document.getElementById('template-lesson-section').cloneNode(true);
    // reset the id - the id is for the template, not the pasted contents
    contentsDiv.id = contentsRef;
    // set the title to be useful
    contentsDiv.querySelector('#lesson_section_ref_title').innerHTML = 'Section ' + contentsRef;
    contentsDiv.querySelector('#delete_lesson_section_button').onclick = function() {deleteLessonSection(contentsRef);};
    contentsDiv.querySelector('#save_lesson_section_button').onclick = function() {saveLessonSection(contentsRef, contentsDiv);};

    // set all the dta on this cloned node
    var priority = contentsDiv.querySelector('#section_priority');
    var heading = contentsDiv.querySelector('#section_title');
    var subtitle = contentsDiv.querySelector('#section_subtitle');
    var image = contentsDiv.querySelector('#section_image');
    var video = contentsDiv.querySelector('#section_video');
    var text = contentsDiv.querySelector('#section_text');
    var textPreview = contentsDiv.querySelector('#section_text_preview');
    
    priority.value = contents['priority'];
    heading.value = contents['title'];
    subtitle.value = contents['subtitle'];
    video.value = contents['video'];
    image.value = contents['image'];
    text.value = contents['text'];
    textPreview.innerHTML = contents['text'];

    if (text.addEventListener) {
        text.addEventListener('input', function() {
            // event handling code for sane browsers, listen to the text area and show a preview
            textPreview.innerHTML = text.value;
        }, false);
    } else if (text.attachEvent) {
        text.attachEvent('onpropertychange', function() {
            // IE-specific event handling code
            textPreview.innerHTML = text.value;
        });
    }

    // and append this div to the content
    contentsContainer.appendChild(contentsDiv);
}

function saveLessonSection(sectionRef, sectionContainer) {
    // get all the data from the page
    var sectionData = {};
    // get the data from the controls into this object = PRIORITY HAS TO BE A NUMBER TO WORK PROPERLY!!!!
    sectionData['priority'] = Number(sectionContainer.querySelector('#section_priority').value);
    sectionData['title'] = sectionContainer.querySelector('#section_title').value;
    sectionData['subtitle'] = sectionContainer.querySelector('#section_subtitle').value;
    sectionData['video'] = sectionContainer.querySelector('#section_video').value;
    sectionData['image'] = sectionContainer.querySelector('#section_image').value;
    sectionData['text'] = sectionContainer.querySelector('#section_text').value;
    
    // and send to firestore
    firebase.firestore().collection(activeLessonCollection + '/' + currentLessonRef + '/contents').doc(sectionRef).set(sectionData).then(function() {
        console.log("Document successfully updated");
    }).catch(function(error) {
        console.error("Error removing document: ", error);
    });
}

function deleteLessonSection(sectionRef) {
    // delete this section from the database
    firebase.firestore().collection(activeLessonCollection + '/' + currentLessonRef + '/contents').doc(sectionRef).delete().then(function() {
        console.log("Document successfully deleted!");
        showLessonSections();
    }).catch(function(error) {
        console.error("Error removing document: ", error);
    });
}

// need to manage the data in this page
function populateUserData() {
    var user = getFirebaseUser();
    if (user) {
        // we are logged in
        displayAdminData(user);
        // get the user data from firebase here
        getFirebaseUserData(user, function(data) {
            // we have the user data here, set the data correctly
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