//AUTH RELATED
const auth = firebase.auth();
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const signInSection = document.getElementById('signInSection');
const signUpSection = document.getElementById('signUpSection');
const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');

const signOutBtn = document.getElementById('signOutBtn');
const signInBtn = document.getElementById('signInBtn');
const signUpBtn = document.getElementById('signUpBtn');
const backToSignInBtn = document.getElementById('backToSignInBtn');
const signUpFromSignInBtn = document.getElementById('signUpFromSignInBtn');
const backFromSignInBtn = document.getElementById('backFromSignInBtn');

const signUpUsernameInput = document.getElementById('signUpUsername')
const signUpEmailInput = document.getElementById('signUpEmail');
const signUpPasswordInput = document.getElementById('signUpPassword');
const signUpConfirmPasswordInput = document.getElementById('signUpConfirmPassword');

const signInEmailInput = document.getElementById('signInEmail');
const signInPasswordInput = document.getElementById('signInPassword');

const userDetails = document.getElementById('userDetails');


// Function to clear input fields
function clearInputFields() {
    signUpUsernameInput.value = '';
    signUpEmailInput.value = '';
    signUpPasswordInput.value = '';
    signUpConfirmPasswordInput.value = '';
    signInEmailInput.value = '';
    signInPasswordInput.value = '';
}

// Show sign up section
signUpFromSignInBtn.onclick = () => {
    clearInputFields();  // Clear fields before showing sign-up
    signInSection.hidden = true;
    signUpSection.hidden = false;
};

backFromSignInBtn.onclick = () => {
    clearInputFields();  // Clear fields before showing sign-up
    signInSection.hidden = true;
    whenSignedOut.hidden = false;
};

// Show sign in section
backToSignInBtn.onclick = () => {
    clearInputFields();  // Clear fields before showing sign-in
    signUpSection.hidden = true;
    signInSection.hidden = false;
};

// Sign Up event handler
signUpBtn.onclick = () => {
    const username = signUpUsernameInput.value.trim();
    const email = signUpEmailInput.value.trim();
    const password = signUpPasswordInput.value;

    if (password !== signUpConfirmPasswordInput.value) {
        alert("Passwords do not match!");
        return;
    }

    // Check if the username contains '@'
    if (username.includes('@')) {
        alert("Username cannot include '@'.");
        return;
    }

    // Check if the username already exists
    db.collection('users').where('UserName', '==', username).get()
    .then(snapshot => {
        console.log("Checking for existing usernames...");
        console.log("Snapshot size:", snapshot.size);
    
        snapshot.forEach(doc => {
            console.log("Found user:", doc.id, doc.data());
        });
        if (!snapshot.empty) {
            alert("Username already exists. Please choose a different username.");
            return;    
        } else {
            // Proceed with sign-up
            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    console.log("Signed up:", userCredential.user);

                    // Create user document in Firestore
                    db.collection('users').doc(userCredential.user.uid).set({
                        UserID: userCredential.user.uid,
                        UserName: username, // Save the username
                        UserEmail: email,   // Save the user email
                        friends_Names: [],
                        friends_ID: [], // Initialize with an empty array
                    })
                    .then(() => {
                        console.log("User document created successfully.");
                        showUserDetails(userCredential.user);
                    })
                    .catch(error => {
                        console.error("Error creating user document:", error);
                        alert(error.message);
                    });
                })
                .catch(error => {
                    console.error("Error signing up:", error);
                    alert(error.message);
                });
        }
    })
    .catch(error => {
        console.error("Error checking username uniqueness:", error);
        alert("An error occurred while checking username availability. Please try again later.");
    });
};


//Sign in event handler
signInBtn.onclick = () => {
    const emailOrUsername = signInEmailInput.value;
    const password = signInPasswordInput.value;

    // Determine if the input is a username or an email
    let userDocRef;

    // Check for a valid email or username
    if (emailOrUsername.includes('@')) {
        // If it includes '@', treat it as an email
        userDocRef = db.collection('users').where("UserEmail", "==", emailOrUsername);
    } else {
        // Treat it as a username
        userDocRef = db.collection('users').where("UserName", "==", emailOrUsername);
    }

    userDocRef.get().then(snapshot => {
        if (snapshot.empty) {
            alert("No user found with that email or username.");
            return;
        }

        // Get the user document and user ID
        const userId = snapshot.docs[0].id;

        // Now, sign in using the email and password
        auth.signInWithEmailAndPassword(snapshot.docs[0].data().UserEmail, password)
            .then(userCredential => {
                console.log("Signed in:", userCredential.user);
                showUserDetails(userCredential.user);
            })
            .catch(error => {
                console.error("Error signing in:", error);
                alert(error.message);
            });
    }).catch(error => {
        console.error("Error searching for user:", error);
        alert(error.message);
    });
};

// Show sign in section when clicking "Sign in with Email"
document.getElementById('signinemail').onclick = () => {
    clearInputFields();  // Clear fields before showing sign-in
    whenSignedOut.hidden = true; // Hide main sign-out section
    signInSection.hidden = false; // Show sign-in section
};

// Sign Out event handler
signOutBtn.onclick = () => {
    auth.signOut().then(() => {
        console.log("Signed out");
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false; // Show main sign-in section
    });
};

// Show user details and switch to signed-in view
function showUserDetails(user) {
    const userDocRef = db.collection('users').doc(user.uid);
    userDocRef.get().then(doc => {
        if (doc.exists) {
            const userData = doc.data();
            userDetails.innerHTML = `<h3>Hello ${userData.UserName}!</h3>`;
        } else {
            console.log("No user document found.");
        }
    }).catch(error => {
        console.error("Error fetching user document:", error);
    });
    whenSignedOut.hidden = true;
    signInSection.hidden = true;
    signUpSection.hidden = true;
    whenSignedIn.hidden = false;
}

console.log("Firebase config:", firebaseConfig);









//-----------------------------------------------------








// Get references to the button elements
const homeBtn = document.getElementById('homeBtn');
const mapBtn = document.getElementById('mapBtn');
const postsBtn = document.getElementById('postsBtn');
const reelsBtn = document.getElementById('reelsBtn');
const groupsBtn = document.getElementById('groupsBtn');
const inboxBtn = document.getElementById('inboxBtn');
const postBtn = document.getElementById('postBtn');

// Get references to the div elements
const homeDiv = document.getElementById('home');
const mapDiv = document.getElementById('map');
const postsDiv = document.getElementById('posts');
const reelsDiv = document.getElementById('reels');
const groupsDiv = document.getElementById('groups');
const inboxDiv = document.getElementById('inbox');

// Function to hide all divs
function hideAllDivs() {
    homeDiv.hidden = true;
    mapDiv.hidden = true;
    postsDiv.hidden = true;
    reelsDiv.hidden = true;
    groupsDiv.hidden = true;
    inboxDiv.hidden = true;
}

// Event listeners for buttons
homeBtn.addEventListener('click', () => {
    hideAllDivs();
    homeDiv.hidden = false;
});

mapBtn.addEventListener('click', () => {
    hideAllDivs();
    mapDiv.hidden = false;
});

postsBtn.addEventListener('click', () => {
    hideAllDivs();
    postsDiv.hidden = false;
});

reelsBtn.addEventListener('click', () => {
    hideAllDivs();
    reelsDiv.hidden = false;
});

groupsBtn.addEventListener('click', () => {
    hideAllDivs();
    groupsDiv.hidden = false;
});

inboxBtn.addEventListener('click', () => {
    hideAllDivs();
    inboxDiv.hidden = false;
});
auth.onAuthStateChanged(user => {
    if (user) {
        showUserDetails(user);
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true; // Hide sign-in section
        
        const currentUserId = user.uid;

        // Get the user's document from Firestore
        const userDocRef = db.collection('users').doc(currentUserId);
        userDocRef.get()
            .then((doc) => {
                if (doc.exists) {
                    const currentUserData = doc.data();

                    // Check if the username is '0'
                    if (currentUserData.UserName === '0') {
                        // Set hidden to false to show the button
                        postBtn.hidden = false;
                    } else {
                        // Keep the button hidden
                        postBtn.hidden = true;
                    }
                } else {
                    console.error('User document not found.');
                }
            })
            .catch((error) => {
                console.error('Error getting user document:', error);
            });

    } else {
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false; // Show main sign-in section
    }
});

// Function to update event documents
function updateEventDocuments() {
    db.collection('events').get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
  
          // Convert date string to Firestore Timestamp
          const dateString = data.date; // "2024-11-22"
          const dateParts = dateString.split("-");
          const dateObject = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
          const dateTimestamp = firebase.firestore.Timestamp.fromDate(dateObject);
  
          // Prepare updated data
          const updatedData = {
            EventName: data.event_name,
            EventLocation: data.event_location,
            EventDescription: data.description1 || data.description2 || '',
            Date: dateTimestamp,
            Picture: data.picture,
            Likes_ID: data.likes_ID || [],
            Userpost_ID: data.userpost_ID || [],
            Group_ID: data.group_ID || []
          };
  
          // Remove old fields
          const fieldsToRemove = {
            event_name: firebase.firestore.FieldValue.delete(),
            event_location: firebase.firestore.FieldValue.delete(),
            description1: firebase.firestore.FieldValue.delete(),
            description2: firebase.firestore.FieldValue.delete(),
            date: firebase.firestore.FieldValue.delete(),
          };
  
          // Update the document
          db.collection('events').doc(doc.id).update({
            ...updatedData,
            ...fieldsToRemove
          })
          .then(() => {
            console.log(`Document ${doc.id} updated successfully.`);
          })
          .catch((error) => {
            console.error(`Error updating document ${doc.id}:`, error);
          });
        });
      })
      .catch((error) => {
        console.error('Error fetching documents:', error);
      });
  }
  
  // Call the function to update documents
  updateEventDocuments();

function listenForPosts() {
    db.collection('events').orderBy('date', 'desc')
        .onSnapshot((snapshot) => {
            // Clear the home div
            homeDiv.innerHTML = '';

            snapshot.forEach((doc) => {
                const postData = doc.data();
                // (Create and append post elements as before)
            });
        }, (error) => {
            console.error('Error listening for posts:', error);
        });
}

function fetchEvents() {
  db.collection('events').orderBy('Date', 'desc').get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Access updated fields
        const eventName = data.EventName;
        const eventLocation = data.EventLocation;
        const eventDescription = data.EventDescription;
        const eventDate = data.Date.toDate(); // Convert Timestamp to Date object
        const pictureUrl = data.Picture;

        // Display or process the event data as needed
      });
    })
    .catch((error) => {
      console.error('Error fetching events:', error);
    });
}

document.addEventListener('DOMContentLoaded', fetchAllPosts);