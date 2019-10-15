var currentLessonRef;

var activeLessonCollection = 'lessons';
var activeLessonPlan = 'everyone';

var lessonPlanData = {};

function setLessonPlan(lessonPlan, collectionName) {
    activeLessonPlan = lessonPlan;
    activeLessonCollection = collectionName;
    removeLessonContent();

    var user = firebaseData.getUser();
    if (user) {
        // we are logged in
        displayAdminData(user);
    }
    else {
        hideAdminData();
    }
}

function addLessonToCollection() {
    // add a new lesson to the current plan
    firebaseData.addLessonToCollection(activeLessonCollection,
        function(newDocRef) {
            // worked, refresh the display of this
            setLessonPlan(activeLessonPlan, activeLessonCollection);
        },
        function(error) {
            // failed
            console.error("Error adding a new lesson: ", error);
        }
    );
}

function deleteLessonFromCollection() {
    firebaseData.deleteLesson(activeLessonCollection, currentLessonRef,
        function() {
            // this worked
            removeLessonContent();
            populateUserData();
        },
        function(error) {
            // failed
            console.error("Error removing lesson: ", error);
        }
    );
}

function addLessonSection() {
    // add a new section to the current lesson
    firebaseData.addLessonSection(activeLessonCollection, currentLessonRef,
        function() {
            // this worked
            showLessonSections()
        },
        function(error) {
            // failed
            console.error("Error adding lesson section: ", error);
        }
    );
}

function displayAdminData(user) {
    // show all the Admin data now, first hide the warning that you are not an admin user
    document.getElementById('not_logged_in').style.display = 'none';
    document.getElementById('not_a_admin').style.display = 'none';
                
    // now get all the lessons and show them all here - just doing lessons ATM as don't know about coa
    var lessonsDiv = document.getElementById('lessons');
    var lessonPlansDiv = document.getElementById('lesson_plan_container');
    // populate this div with the lessons from firebase
    firebaseData.getLessonPlan(activeLessonPlan,
        function(doc) {
            // this worked
            if (doc.exists) {
                // do stuff with the data
                displayLessonPlan(lessonPlansDiv, doc.data());
            } else {
                // error
                lessonsDiv.innerHTML = 'failed to find the lesson plan, sorry...';
            }
        },
        function(error) {
            // failed
            console.error("Error getting the lesson plan: ", error);
        }
    );
    
    // get all the lessons in the collection
    firebaseData.getCollectionLessons(true, activeLessonCollection,
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
        },
        function(error) {
            // failed
            console.error("Error getting the lessons: ", error);
        }
    );
}

function createLessonPlanFromOrder() {
    // this will overwrite the lesson plan with the collection of lessons, and their ordering
    firebaseData.getCollectionLessons(false, activeLessonCollection,
        function(querySnapshot) {
            // get each lesson in the snapshot, create the lesson plan from this (zero excluded otherwise in order)
            var lessonsRefs = [];
            var lessonsNames = [];
            var db = firebase.firestore();
            querySnapshot.forEach(function(doc) {
                // doc.data() is never undefined for query doc snapshots, add the name and the ref to the arrays created
                lessonsRefs.push(db.doc('/' + activeLessonCollection + '/' + doc.id));
                lessonsNames.push(doc.data()['name']);
            });
            firebaseData.setLessonPlan(activeLessonPlan, lessonsRefs, lessonsNames,
                function() {
                    // this worked
                    displayAdminData();
                },
                function(error) {
                    // failed
                    console.error("Error setting the lesson plan: ", error);
                }
            );
        },
        function(error) {
            // failed
            console.error("Error getting the collection lessons: ", error);
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
    firebaseData.getLesson(activeLessonCollection, lessonRef,
        function(doc) {
            if (doc.exists) {
                // show this lesson content
                displayLessonContent(doc.data());
            } else {
                // error
                removeLessonContent();
                document.getElementById('lesson_content').innerHTML = "Sorry, couldn't find a lesson for " + lessonRef;
            }
        },
        function(error) {
            removeLessonContent();
            console.log("Error getting lesson content:", error);
        });
}

function showLessonSections() {
    // show the sections for the current lesson loaded, first remove old ones
    removeLessonSections();

    // now get them all
    firebaseData.getLessonSections(true, activeLessonCollection, currentLessonRef,
        function(querySnapshot) {
            // we have all the contents of the lesson now, put each content found back in
            var sectionContainer = document.getElementById('lesson_section_container');
            querySnapshot.forEach(function (doc) {
                // doc.data() is never undefined for query doc snapshots
                createLessonContentsDiv(sectionContainer, doc.id, doc.data());
            });
        },
        function(error) {
            console.log("Failed to get the lesson sections: ", error);
        });
}

function saveLessonToCollection() {
    // get all the data from the page
    var lessonData = {};
    // create the object of data to send
    lessonData['priority'] = Number(document.getElementById('priority').value);
    lessonData['name'] = document.getElementById('name').value;
    lessonData['subtitle'] = document.getElementById('subtitle').value;
    lessonData['progress_options'] = document.getElementById('progress_options').value;

    firebaseData.setLesson(activeLessonCollection, currentLessonRef, lessonData, 
        function() {
            // this worked, remove the red (saved now)
            document.getElementById('save_lesson_button').classList.remove('special');
            // and show the new order if it changed
            displayAdminData();
        },
        function(error) {
            // this failed
            console.error("Error setting the lesson data: ", error);
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
    document.getElementById('lesson_ref_title').innerHTML = 'Lesson: ' + currentLessonRef;

    var saveButton = document.getElementById('save_lesson_button');

    var priority = document.getElementById('priority');
    var name = document.getElementById('name');
    var subtitle = document.getElementById('subtitle');
    var progressOptions = document.getElementById('progress_options');
    
    // set all the data for the lesson
    priority.value = lessonData['priority'];
    name.value = lessonData['name'];
    subtitle.value = lessonData['subtitle'];
    progressOptions.value = lessonData['progress_options'];
    
    // listen to changes on all of these
    listenForChange(priority, function() {onContentsChanged(saveButton)});
    listenForChange(name, function() {onContentsChanged(saveButton)});
    listenForChange(subtitle, function() {onContentsChanged(saveButton)});
    listenForChange(progressOptions, function() {onContentsChanged(saveButton)});
    
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
    // setup the save button to be clear (no changes yet)
    var saveButton = contentsDiv.querySelector('#save_lesson_section_button');
    saveButton.onclick = function() {saveLessonSection(contentsRef, contentsDiv);};

    // set all the dta on this cloned node
    var priority = contentsDiv.querySelector('#section_priority');
    var heading = contentsDiv.querySelector('#section_title');
    var subtitle = contentsDiv.querySelector('#section_subtitle');
    var image = contentsDiv.querySelector('#section_image');
    var video = contentsDiv.querySelector('#section_video');
    var text = contentsDiv.querySelector('#section_text');
    var textPreview = contentsDiv.querySelector('#section_text_preview');
    
    // set all the data
    priority.value = contents['priority'];
    heading.value = contents['title'];
    subtitle.value = contents['subtitle'];
    video.value = contents['video'];
    image.value = contents['image'];
    text.value = contents['text'];
    textPreview.innerHTML = contents['text'];

    // listen to changes on all of these
    listenForChange(priority, function() {onContentsChanged(saveButton)});
    listenForChange(heading, function() {onContentsChanged(saveButton)});
    listenForChange(subtitle, function() {onContentsChanged(saveButton)});
    listenForChange(image, function() {onContentsChanged(saveButton)});
    listenForChange(video, function() {onContentsChanged(saveButton)});
    // text is more involved
    listenForChange(text, function() {
        // show the preview
        textPreview.innerHTML = text.value;
        // change the save button to be red (has changed something)
        onContentsChanged(saveButton);
    });

    // and append this div to the content
    contentsContainer.appendChild(contentsDiv);
    // just set all the data, save should not be red
    saveButton.classList.remove('special');
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

function onContentsChanged(saveButton) {
    // show the contents have changed
    saveButton.classList.add('special');
}

function addTagsToSibling(source, siblingId, tags) {
    var textArea = source.parentElement.querySelector(siblingId);
    insertAtCursor(textArea, tags);
}

function insertAtCursor(myField, myValue) {
    //IE support
    if (document.selection) {
        myField.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
    }
    // Microsoft Edge
    else if(window.navigator.userAgent.indexOf("Edge") > -1) {
      var startPos = myField.selectionStart; 
      var endPos = myField.selectionEnd; 

      myField.value = myField.value.substring(0, startPos)+ myValue 
             + myField.value.substring(endPos, myField.value.length); 

      var pos = startPos + myValue.length;
      myField.focus();
      myField.setSelectionRange(pos, pos);
    }
    //MOZILLA and others
    else if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
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
    firebaseData.setLessonSection(activeLessonCollection, currentLessonRef, sectionRef, sectionData,
        function() {
            // this worked - remove the red from the button
            sectionContainer.querySelector('#save_lesson_section_button').classList.remove('special');
        },
        function() {
            // this failed
            console.error("Error saving the lesson section: ", error);
        });
}

function deleteLessonSection(sectionRef) {
    // delete this section from the database
    firebaseData.deleteLessonSection(activeLessonCollection, currentLessonRef, sectionRef,
        function() {
            // this worked
            showLessonSections();
        },
        function() {
            // this failed
            console.error("Error deleting the lesson section: ", error);
        });
}

// need to manage the data in this page
function populateUserData() {
    var user = firebaseData.getUser();
    if (user) {
        // we are logged in
        displayAdminData(user);
        firebaseData.getUserData(user, 
            function(data) {
                // we have the user data here, set the data correctly
                if (firebaseData.isUserAdmin(data)) {
                    // we are a coach
                    displayAdminData(user);
                }
                else {
                    // we are not an admin user - hide it all
                    hideAdminData(user);
                }
            },
            function(error) {
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