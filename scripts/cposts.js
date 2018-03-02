/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes FriendlyChat.
function FriendlyChat() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');

  this.messageInput = '<input class="mdl-textfield__input" type="text" id="message">';
  console.log(this.messageInput);
  this.dateInput = document.getElementById('date');
  this.phoneInput = document.getElementById('phone');
  this.audiencecountInput = document.getElementById('audiencecount');
  this.mentorcountInput = document.getElementById('mentorcount');
  console.log(this.dateInput);

  this.submitButton = document.getElementById('submit');
  
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');
  this.acceptbutton = document.getElementById('acceptbutton');
this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
 
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  

  // Events for image upload.
 
  
  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
FriendlyChat.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Loads chat messages history and listens for upcoming ones.
FriendlyChat.prototype.loadMessages = function() {
  this.messagesRef = this.database.ref('messages').child('gposts');
  // Make sure we remove all previous listeners.
  this.messagesRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function(data) {
    var val = data.val();

    this.displayMessage(data.key, val.name, val.topic,val.phone,val.date,val.audcount,val.mcount, val.accepted,val.studacceptd,val.college,val.mentor,val.today,val.photoUrl, val.imageUrl);
    console.log(val.topic);
  }.bind(this);

  this.messagesRef.limitToLast(12).on('child_added', setMessage);
  this.messagesRef.limitToLast(12).on('child_changed', setMessage);
};
function getParent(snapshot) {
  // You can get the reference (A Firebase object) from a snapshot
  // using .ref().
  var ref = snapshot.val;
  // Now simply find the parent and return the name.
  return ref.parent.name;
}

// Saves a new message on the Firebase DB.
FriendlyChat.prototype.saveMessage = function(e) {
  
};

// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
FriendlyChat.prototype.setImageUrl = function(imageUri, imgElement) {
  if (imageUri.startsWith('gs://')) {
    imgElement.src = FriendlyChat.LOADING_IMAGE_URL; // Display a loading image first.
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
FriendlyChat.prototype.saveImageMessage = function(event) {
  event.preventDefault();
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (this.checkSignedInWithMessage()) {

    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = this.auth.currentUser;
    this.messagesRef.push({
      name: currentUser.displayName,
      imageUrl: FriendlyChat.LOADING_IMAGE_URL,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    }).then(function(data) {

      // Upload the image to Cloud Storage.
      var filePath = currentUser.uid + '/' + data.key + '/' + file.name;
      return this.storage.ref(filePath).put(file).then(function(snapshot) {

        // Get the file's Storage URI and update the chat message placeholder.
        var fullPath = snapshot.metadata.fullPath;
        return data.update({imageUrl: this.storage.ref(fullPath).toString()});
      }.bind(this));
    }.bind(this)).catch(function(error) {
      console.error('There was an error uploading a file to Cloud Storage:', error);
    });
  }
};

// Signs-in Friendly Chat.
FriendlyChat.prototype.signIn = function() {
   // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
FriendlyChat.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut().then(function() {
  // Sign-out successful.
  window.location.href = "index.html";
}).catch(function(error) {
  // An error happened.
});
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
FriendlyChat.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL; // Only change these two lines!
    var userName = user.displayName;        // TODO(DEVELOPER): Get user's name.

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadMessages();

    // We save the Firebase Messaging Device token and enable notifications.
    this.saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
FriendlyChat.prototype.checkSignedInWithMessage = function() {
  /* TODO(DEVELOPER): Check if user is signed-in Firebase. */
   if (this.auth.currentUser) {
    return true;
  }
  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Saves the messaging device token to the datastore.
FriendlyChat.prototype.saveMessagingDeviceToken = function() {
  firebase.messaging().getToken().then(function(currentToken) {
    if (currentToken) {
      console.log('Got FCM device token:', currentToken);
      // Saving the Device Token to the datastore.
      firebase.database().ref('/fcmTokens').child(currentToken)
          .set(firebase.auth().currentUser.uid);
    } else {
      // Need to request permissions to show notifications.
      this.requestNotificationsPermissions();
    }
  }.bind(this)).catch(function(error){
    console.error('Unable to get messaging token.', error);
  });
};

// Requests permissions to show notifications.
FriendlyChat.prototype.requestNotificationsPermissions = function() {
  console.log('Requesting notifications permission...');
  firebase.messaging().requestPermission().then(function() {
    // Notification permission granted.
    this.saveMessagingDeviceToken();
  }.bind(this)).catch(function(error) {
    console.error('Unable to get permission to notify.', error);
  });
};

// Resets the given MaterialTextField.
FriendlyChat.resetMaterialTextfield = function(element1,element2,element3,element4,element5,element6,element7,element8,element9,element10) {
  element1.value = '';
  element1.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element2.value = '';
  element2.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element3.value = '';
  element3.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element4.value = '';
  element4.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element5.value = '';
  element5.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element6.value = '';
  element6.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element7.value = '';
  element7.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element8.value = '';
  element8.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element9.value = '';
  element9.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element10.value = '';
  element10.parentNode.MaterialTextfield.boundUpdateClassesHandler();

};
function showIt(element) {
  var parent = element.parentNode;
  console.log(parent.id);
 
    
    firebase.database().ref('messages').child('gposts').child(parent.id).update({
      
      accepted:"Yes"
    })
}
// Template for messages.
FriendlyChat.MESSAGE_TEMPLATE_NOT_ACCEPTED =

    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<form id="message-form-in" action="#"> '+
       '<div class="name"></div>' +
      ' <div class="topic"></div>' +
       '<div class="date"></div>' +
        '<div class="phone"></div>' +
         '<div class="audcount"></div>' +
          '<div class="mcount"></div>' +
          '<div class="accept"></div>'+
          ''+
           ' </form>'+
     
    '</div>';
  FriendlyChat.MESSAGE_TEMPLATE_ACCEPTED =

    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<form id="message-form-in" action="#"> '+
       '<div class="name"></div>' +
      ' <div class="topic"></div>' +
       '<div class="date"></div>' +
        '<div class="phone"></div>' +
         '<div class="audcount"></div>' +
          '<div class="mcount"></div>' +
          '<div class="accept"></div>'+
         ' </form>'+
     
   '</div>';

// A loading image URL.
FriendlyChat.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
FriendlyChat.prototype.displayMessage = function(key, name, topic,phone,date,audcount,mcount,accepted,studaccepted,college,mentor,postdate, picUrl, imageUri) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    if(accepted == "Yes")
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE_ACCEPTED;
  if(accepted == "No")
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE_NOT_ACCEPTED;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }
  
  div.querySelector('.name').textContent = name;

 
  var phoneElement = div.querySelector('.phone');
  var dateElement = div.querySelector('.date');
  var audElement = div.querySelector('.audcount');
  var mentorElement = div.querySelector('.mcount');
  var acceptElement = div.querySelector(".accept");

  if (topic) { // If the message is text.
    div.querySelector('.topic').textContent ="Topic : "+ topic;
    // Replace all line breaks by <br>.
    phoneElement.textContent =  "Phonenumber : "+phone;
    // Replace all line breaks by <br>.
    phoneElement.innerHTML = phoneElement.innerHTML.replace(/\n/g, '<br>');
    dateElement.textContent = "Date : "+date;

    // Replace all line breaks by <br>.
    dateElement.innerHTML = dateElement.innerHTML.replace(/\n/g, '<br>');
    audElement.textContent =  "Audience Count : "+audcount;
    // Replace all line breaks by <br>.
    audElement.innerHTML = audElement.innerHTML.replace(/\n/g, '<br>');
    mentorElement.textContent =  "Mentor Count : "+mcount;
    // Replace all line breaks by <br>.
    // 
    mentorElement.innerHTML = mentorElement.innerHTML.replace(/\n/g, '<br>'); console.log("accepted = "+accepted);
    


    div.querySelector('.topic').id = "topic"+this.auth.currentUser.uid+postdate;
    div.querySelector('.phone').id = "phone"+this.auth.currentUser.uid+postdate;
    div.querySelector('.date').id = "date"+this.auth.currentUser.uid+postdate;
    div.querySelector('.audcount').id = "audcount"+this.auth.currentUser.uid+postdate;
    div.querySelector('.mcount').id = "mcount"+this.auth.currentUser.uid+postdate;
    div.querySelector('.accept').id = this.auth.currentUser.uid+postdate;
    if(accepted == "Yes"&&studaccepted=="Yes")
    { acceptElement.textContent = "Accepted by "+mentor+" from "+college;

    }
   
  else
    { 

          acceptElement.textContent = "Awaiting Response";
    }
    
  acceptElement.innerHTML = acceptElement.innerHTML.replace(/\n/g, '<br>');
  
  
    
    

  } else if (imageUri) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
 
};

// Enables or disables the submit button depending on the values of the input
// fields.
FriendlyChat.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
FriendlyChat.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
};

window.onload = function() {
  window.friendlyChat = new FriendlyChat();
};
