var currentLessonRef;
var currentLessonProgress;

function displayMembersData(user) {
    // show all the Members data now, first hide the warning that you are not a coach
    document.getElementById('not_logged_in').style.display = 'none';
    document.getElementById('not_a_member').style.display = 'none';
                
    // now get all the lessons and show them all here
    var lessonsDiv = document.getElementById('lessons');
    // populate this div with the lessons from firebase
    var db = firebase.firestore();
    // get the data for the user
    const docRef = db.collection('lesson_plans').doc('everyone')
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

function hideMembersData(user) {
    // hide all the Members data
    document.getElementById('lessons').style.display = 'none';
    if (user) {
        // have a user, but not a member, tell them to upgrade
        document.getElementById('not_logged_in').style.display = 'none';
        document.getElementById('not_a_member').style.display = null;
    }
    else {
        // we are not logged in, ask the user to log in
        document.getElementById('not_logged_in').style.display = null;
        document.getElementById('not_a_member').style.display = 'none';
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
            // we have the data, is there a last 'members_lesson' reference
            if (userData) {
                var lessonRef = userData['last_members_lesson'];
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
            usersUpdate['last_members_lesson'] = currentLessonRef;
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

    var progressControl = document.getElementById('progress_display');
    if (progress) {
        progressControl.value = progress;
        progressControl.style.display = null;
    }
    else {
        progressControl.style.display = 'none';
    }
}

function onClickLesson(lessonRef) {
    // they clicked a button then, show the content
    // this needs the user data while we are here
    var user = getFirebaseUser();
    if (user) {
        // there is a user, get the data
        getFirebaseUserData(user, function(userData) {
            // we have the data, is there a last 'members_lesson' reference
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
    currentLessonProgress = userData['progress_' + lessonRef];

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
    const docRef = db.collection('lessons').doc(lessonRef)
    docRef.get().then(function(doc) {
        if (doc.exists) {
            // show this lesson content
            displayLessonContent(lessonRef, doc.data());
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

function displayLessonContent(lessonRef, lessonData) {
    removeLessonContent()
    var lessonContent = document.getElementById('lesson_content');
    document.getElementById('lesson_name').innerHTML = lessonData['name'];
    document.getElementById('lesson_subtitle').innerHTML = lessonData['subtitle'];
    document.getElementById('lesson_content').style.display = null;

    var progressOptions = lessonData['progress_options'];
    if (progressOptions) {
        // get the template progress button
        var progressButtonTemplate = document.getElementById('template-lesson-progress');
        var progressContainer = lessonContent.querySelector('#lesson_progress_container');
        // remove all the progress buttons from the container to start clean
        var child = progressContainer.lastElementChild;  
        while (child) { 
            progressContainer.removeChild(child); 
            child = progressContainer.lastElementChild; 
        } 
        // there are options for progress to be recorded, get the options and create the buttons for them here
        var optionsArray = progressOptions.split(',');
        for (var i = 0; i < optionsArray.length; ++i) {
            // for each option, create the progress button
            var progressButtonParent = progressButtonTemplate.cloneNode(true);
            // get rid of the non-unique id
            progressButtonParent.id = null;
            var progressButton = progressButtonParent.querySelector('#lesson-progress-button');
            var settingsArray = optionsArray[i].split(':');
            progressButton.innerHTML = settingsArray[0];
            progressButton.id = 'lesson_progress_' + settingsArray[1];
            progressButton.setAttribute("onClick", "setLessonProgress('" + settingsArray[1] + "')");
            // add to the container
            progressContainer.appendChild(progressButtonParent);
        }

        // so we need to get all the contents under this lesson, and add a div of content for each of them
        var db = firebase.firestore();
        // get all the lessons in the collection
        db.collection('lessons/' + lessonRef + '/contents').where("priority", ">", 0).orderBy("priority").get().then(
            function (querySnapshot) {
                // we have all the contents of the lessonref now, clear all the old contents children
                var contentsContainer = lessonContent.querySelector('#lesson_contents_container');
                var child = contentsContainer.lastElementChild;
                while (child) {
                    contentsContainer.removeChild(child);
                    child = contentsContainer.lastElementChild;
                }
                // and put each content found back in
                querySnapshot.forEach(function (doc) {
                    // doc.data() is never undefined for query doc snapshots
                    createLessonContentsDiv(contentsContainer, doc.id, doc.data());
                });
            }
        );
    }

    // show the current progress
    showLessonProgress(currentLessonProgress);
}

function resizeDocumentContent(source, idsToResize, targetSizeId, alternateButtonId) {
    var commonParent = source;
    var targetElement;
    do {
        // try to find the target under the common parent
        targetElement = commonParent.querySelector(targetSizeId);
        // keep looking up
        commonParent = commonParent.parentElement;
    } while (!targetElement && commonParent);

    var alternateButton = commonParent.querySelector(alternateButtonId);
    if (alternateButton) {
        // change buttons
        source.style.display = 'none';
        alternateButton.style.display = null;
    }
    
    var width = targetElement.offsetWidth;
    var idArray = idsToResize.split(',');
    for (var i = 0; i < idArray.length; ++i) {
        var elementToResize = commonParent.querySelector(idArray[i]);
        if (elementToResize) {
            var heightFactor = elementToResize.offsetHeight / elementToResize.offsetWidth
            if (!alternateButton && elementToResize.width == width) {
                // no alternative button and the element is already big, shrink it back
                elementToResize.removeAttribute('width');
                elementToResize.removeAttribute('height');
            }
            else {
                elementToResize.width = width;
                elementToResize.height = heightFactor * width;
            }
        }
    }
}

function resizeDocumentContentReset(source, idsToResize, targetSizeId, alternateButtonId) {
    var commonParent = source;
    var targetElement;
    do {
        // try to find the target under the common parent
        targetElement = commonParent.querySelector(targetSizeId);
        // keep looking up
        commonParent = commonParent.parentElement;
    } while (!targetElement && commonParent);

    var alternateButton = commonParent.querySelector(alternateButtonId);
    if (alternateButton) {
        // change buttons
        source.style.display = 'none';
        alternateButton.style.display = null;
    }
    
    var idArray = idsToResize.split(',');
    for (var i = 0; i < idArray.length; ++i) {
        var elementToResize = commonParent.querySelector(idArray[i]);
        if (elementToResize) {
            // reset the size
            elementToResize.removeAttribute('width');
            elementToResize.removeAttribute('height');
        }
    }
}

function createLessonContentsDiv(contentsContainer, contentsRef, contents) {
    // find the template and copy it to the contentsContainer before populating the relevant data
    var contentsDiv = document.getElementById('template-lesson-content').cloneNode(true);
    // reset the id - the id is for the template, not the pasted contents
    contentsDiv.id = contentsRef;
    // set all the dta on this cloned node
    var heading = contentsDiv.querySelector('#lesson_content_heading');
    var subtitle = contentsDiv.querySelector('#lesson_content_subtitle');
    var image, video, text;
    
    if (contents['image'] && contents['video']) {
        // show the three part data section
        contentsDiv.querySelector('#lesson_content_three').style.display = null;
        video = contentsDiv.querySelector('#lesson_content_video_three');
        image = contentsDiv.querySelector('#lesson_content_image_three');
        text = contentsDiv.querySelector('#lesson_content_three_of_three');
    }
    else {
        // show the two part data section
        contentsDiv.querySelector('#lesson_content_two').style.display = null;
        text = contentsDiv.querySelector('#lesson_content_two_of_two');
        if (contents['image']) {
            // show the image only
            image = contentsDiv.querySelector('#lesson_content_image_two');
        
        }
        else if (contents['video']) {
            // show the video only
            video = contentsDiv.querySelector('#lesson_content_video_two');
            // show the button to grow this
            contentsDiv.querySelector('#lesson_content_grow_video_two').style.display = null;
        }
        else {
            //oops - need one or the other! show text only - will show the logo with the text
            contentsDiv.querySelector('#lesson_content_image_two').style.display = null;
        }
    }

    // set the contents then
    if (heading) {
        heading.innerHTML = contents['title'];
    }
    if (subtitle) {
        subtitle.innerHTML = contents['subtitle'];
    }
    if (video) {
        video.src = contents['video'];
        video.style.display = null;
    }
    if (image) {
        image.src = contents['image'];
        image.style.display = null;
    }
    if (text) {
        text.innerHTML = contents['text'];
    }

    // and append this div to the content
    contentsContainer.appendChild(contentsDiv);
}

function removeLessonContent() {
    document.getElementById('lesson_content').style.display = 'none';
}

// need to manage the data in this page
function populateUserData() {
    var user = getFirebaseUser();
    if (user) {
        // we are logged in
        displayMembersData(user);
        // get the user data from firebase here
        getFirebaseUserData(user, function(data) {
            // we have the user data here, set the data correctly
            if (isFirebaseUserCoach(data)) {
                // we are a coach
                displayMembersData(user);
            }
            else {
                // we are not a coach
                hideMembersData(user);
            }
        }, function() {
            // this is the failure to get the data, do our best I suppose
            hideMembersData(user);
            console.log("Failed to get the firestore user data for " + user);
        });
    }
    else {
        // we are not logged in, ask the user to log in
        hideMembersData(user);
    }
};

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});