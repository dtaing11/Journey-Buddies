//AUTH RELATED
const auth = firebase.auth();
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

//const signInSection = document.getElementById('signInSection');
//const signUpSection = document.getElementById('signUpSection');
//const whenSignedIn = document.getElementById('whenSignedIn');
// const whenSignedOut = document.getElementById('whenSignedOut');

// const signOutBtn = document.getElementById('signOutBtn');
const signInBtn = document.getElementById('signInBtn');
const signUpBtn = document.getElementById('signUpBtn');

const signUpUsernameInput = document.getElementById('signUpUsername')
const signUpEmailInput = document.getElementById('signUpEmail');
const signUpPasswordInput = document.getElementById('signUpPassword');
const signUpConfirmPasswordInput = document.getElementById('signUpConfirmPassword');

const signInEmailInput = document.getElementById('signInEmail');
const signInPasswordInput = document.getElementById('signInPassword');

//const userDetails = document.getElementById('userDetails');


// Function to clear input fields
function clearInputFields() {
    signUpUsernameInput.value = '';
    signUpEmailInput.value = '';
    signUpPasswordInput.value = '';
    signUpConfirmPasswordInput.value = '';
    signInEmailInput.value = '';
    signInPasswordInput.value = '';
}

// Sign Up event handler
document.getElementById('signUpBtn').addEventListener('click', handleSignUp);

function handleSignUp(event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById('signUpUsername').value.trim();
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const signUpConfirmPasswordInput = document.getElementById('signUpConfirmPassword').value;

    // Check if passwords match
    if (password !== signUpConfirmPasswordInput) {
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
                        UserName: username,
                        UserEmail: email,
                        friends_Names: [],
                        friends_ID: [],
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
}



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
                // Redirect to map.html
                window.location.href = '../map.html'; // Adjust the path if needed
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

// // Show sign in section when clicking "Sign in with Email"
// signInEmailInput.onclick = () => {
//     clearInputFields();  // Clear fields before showing sign-in
//     whenSignedOut.hidden = true; // Hide main sign-out section
//     signInSection.hidden = false; // Show sign-in section
// };

// // Sign Out event handler
// signOutBtn.onclick = () => {
//     auth.signOut().then(() => {
//         console.log("Signed out");
//         whenSignedIn.hidden = true;
//         whenSignedOut.hidden = false; // Show main sign-in section
//     });
// };

//Show user details and switch to signed-in view
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

// console.log("Firebase config:", firebaseConfig);