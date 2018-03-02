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
  

  
  this.signInButton = document.getElementById('sign-in');

  // Saves message on form submit.
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Toggle for the button.
  
  

  

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








// Signs-in Friendly Chat.
FriendlyChat.prototype.signIn = function() {
   // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider).then(function(result) {
  
  var currentUser = result.user ;
  console.log(currentUser.email+currentUser);
  firebase.database().ref('messages').child('users').once("value", function(snapshot) {
  
});
  firebase.database().ref('messages').child('users').child(currentUser.uid).set({
      username: currentUser.displayName,
    email: currentUser.email,
    uid: currentUser.uid,
    state:"not set"
    });
  window.location.href = "choice.html";
}).catch(function(error) {
  console.log(error);
});
  
};



// Triggers when the auth state change for instance when the user signs-in or signs-out.
FriendlyChat.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    
    this.signInButton.setAttribute('hidden', 'true');

 
  } else { // User is signed out!
    
    this.signInButton.removeAttribute('hidden');
  }
};




window.onload = function() {
  window.friendlyChat = new FriendlyChat();
};
