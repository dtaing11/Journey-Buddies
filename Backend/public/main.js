//AUTH RELATED
const auth = firebase.auth();
const firebaseConfig = {
  apiKey: "AIzaSyBrl6bcC2ZqBXxkE-F-38xaB9xQBWMiV24",
  authDomain: "journey-buddies.firebaseapp.com",
  projectId: "journey-buddies",
  storageBucket: "journey-buddies.firebasestorage.app",
  messagingSenderId: "432550474346",
  appId: "1:432550474346:web:22f6f0b3b6f5bb3cd69013",
  measurementId: "G-42MS9QF9CB"
};

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
const backFromFriendsSection = document.getElementById('backFromFriendsSection')

const signUpUsernameInput = document.getElementById('signUpUsername')
const signUpEmailInput = document.getElementById('signUpEmail');
const signUpPasswordInput = document.getElementById('signUpPassword');
const signUpConfirmPasswordInput = document.getElementById('signUpConfirmPassword');

const signInEmailInput = document.getElementById('signInEmail');
const signInPasswordInput = document.getElementById('signInPassword');

const userDetails = document.getElementById('userDetails');


// Function to clear input fields
function clearInputFields() {
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
    const username = signUpUsernameInput.value;
    const email = signUpEmailInput.value;
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

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log("Signed up:", userCredential.user);

            // Create user document in Firestore
            db.collection('users').doc(userCredential.user.uid).set({
                UserID: userCredential.user.uid,
                UserName: username, // Save the username
                UserEmail: email,   // Save the user email
                friends_ID: [],      // Initialize with an empty array of tuples
                friends_Names: []
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

// Sign in with Google
document.getElementById('signingoogle').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(userCredential => {
            console.log("Signed in with Google:", userCredential.user);

            // Get the user's Google profile information
            const user = userCredential.user;
            const username = user.displayName || "User"; // Use Google nickname or default to "User"
            const email = user.email;

            // Reference to the user document
            const userDocRef = db.collection('users').doc(user.uid);

            // Check if the user document already exists
            userDocRef.get().then(doc => {
                if (doc.exists) {
                    console.log("User document already exists:", doc.data());
                    // You can update UI or perform other actions here
                } else {
                    // User document does not exist, create it
                    console.log("Creating new user document for:", user.uid);
                    return userDocRef.set({
                        UserID: user.uid,
                        UserName: username, // Save the Google nickname as username
                        UserEmail: email,   // Save the user email
                        friends_ID: [],      // Initialize with an empty array of tuples
                        friends_Names: []
                    });
                }
            })
            .then(() => {
                console.log("User document created successfully.");
                showUserDetails(user); // Update UI with user details
            })
            .catch(error => {
                console.error("Error accessing user document:", error);
                alert(error.message);
            });
        })
        .catch(error => {
            console.error("Error signing in with Google:", error);
            alert(error.message);
        });
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

backFromFriendsSection.onclick = () => {
    clearInputFields();  // Clear fields before showing sign-up
    friendsSection.hidden = true;
    whenSignedIn.hidden = false;
};