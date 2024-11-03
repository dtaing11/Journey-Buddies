// Wait for the window to load
window.addEventListener('load', () => {
    // Get references to the DOM elements
    const usernameDisplay = document.getElementById('username-display');
    const emailDisplay = document.getElementById('email-display');
    const descriptionDisplay = document.getElementById('description-display');
    const profilePictureElement = document.getElementById('profile-picture');

    const usernameInput = document.getElementById('username-input');
    const descriptionInput = document.getElementById('description-input');
    const profilePictureInput = document.getElementById('profile-picture-input');

    const backButton = document.getElementById('back-button');
    const userActions = document.getElementById('user-actions');
    const editProfileButton = document.getElementById('edit-profile-button');
    const changePasswordButton = document.getElementById('change-password-button');

    const editActions = document.getElementById('edit-actions');
    const saveProfileButton = document.getElementById('save-profile-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');

    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    let currentUserId = null;
    let currentUserData = null;

    // Handle the Back button click
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html'; // Redirect back to main page
    });

    // Check if the user is signed in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUserId = user.uid;

            // Fetch user data from Firestore
            const userDocRef = db.collection('users').doc(currentUserId);
            userDocRef.get()
                .then((doc) => {
                    if (doc.exists) {
                        currentUserData = doc.data();

                        // Display user data
                        displayUserData();

                        // Show Edit and Change Password buttons
                        userActions.hidden = false;

                        // Add event listeners
                        editProfileButton.addEventListener('click', startEditing);
                        cancelEditButton.addEventListener('click', cancelEditing);
                        saveProfileButton.addEventListener('click', saveProfile);

                        changePasswordButton.addEventListener('click', () => {
                            changePassword();
                        });

                    } else {
                        // User document does not exist
                        console.log('No user document found.');
                        alert('User data not found.');
                    }
                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                    alert('Error fetching user data.');
                });

        } else {
            // User is not signed in
            console.log('No user is signed in.');
            // Redirect to sign-in page or display a message
            alert('You are not signed in. Please sign in first.');
            window.location.href = 'index.html'; // Redirect to your main page or sign-in page
        }
    });

    // Function to display user data
    function displayUserData() {
        usernameDisplay.textContent = currentUserData.UserName;
        emailDisplay.textContent = currentUserData.UserEmail;
        descriptionDisplay.textContent = currentUserData.Description || 'No description provided.';
        profilePictureElement.src = currentUserData.UserImage || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    }

    // Function to start editing
    function startEditing() {
        // Hide display elements and show input fields
        usernameDisplay.style.display = 'none';
        descriptionDisplay.style.display = 'none';

        usernameInput.style.display = 'block';
        descriptionInput.style.display = 'block';
        profilePictureInput.style.display = 'block';

        // Populate input fields with current data
        usernameInput.value = currentUserData.UserName || '';
        descriptionInput.value = currentUserData.Description || '';

        // Show Save and Cancel buttons
        editActions.style.display = 'block';

        // Disable Edit Profile and Change Password buttons
        editProfileButton.disabled = true;
        changePasswordButton.disabled = true;
    }

    // Function to cancel editing
    function cancelEditing() {
        // Hide input fields and show display elements
        usernameDisplay.style.display = 'inline';
        emailDisplay.style.display = 'inline';
        descriptionDisplay.style.display = 'block';

        usernameInput.style.display = 'none';
        descriptionInput.style.display = 'none';
        profilePictureInput.style.display = 'none';

        // Hide Save and Cancel buttons
        editActions.style.display = 'none';

        // Enable Edit Profile and Change Password buttons
        editProfileButton.disabled = false;
        changePasswordButton.disabled = false;
    }

    // Function to save profile changes
    function saveProfile() {
        // Get new values from input fields
        const newUsername = usernameInput.value.trim();
        const newDescription = descriptionInput.value.trim();

        let updates = {};

        if (newUsername !== currentUserData.UserName) {
            updates.UserName = newUsername;
        }
        if (newDescription !== currentUserData.Description) {
            updates.Description = newDescription;
        }

        // Handle profile picture upload
        const file = profilePictureInput.files[0];
        if (file) {
            // Create a storage ref
            const storageRef = storage.ref();
            const userImageRef = storageRef.child(`profile_pictures/${currentUserId}/${file.name}`);

            // Upload file
            const uploadTask = userImageRef.put(file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Handle progress updates
                    console.log('Upload progress:', (snapshot.bytesTransferred / snapshot.totalBytes) * 100 + '%');
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error('Error uploading file:', error);
            
                    const errorCode = error.code;
                    const errorMessage = error.message;
            
                    console.error('Error code:', errorCode);
                    console.error('Error message:', errorMessage);
            
                    alert('Error uploading profile picture: ' + errorMessage);
                },
                () => {
                    // Handle successful uploads
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        updates.UserImage = downloadURL;
            
                        // Update Firestore with new data including UserImage
                        updateUserProfile(updates);
                    }).catch((error) => {
                        console.error('Error getting download URL:', error);
                        alert('Error getting download URL: ' + error.message);
                    });
                }
            );
        } else {
            // No new profile picture, just update Firestore
            updateUserProfile(updates);
        }
    }

    // Function to update user profile in Firestore and handle email updates
    function updateUserProfile(updates) {
        const userDocRef = db.collection('users').doc(currentUserId);
        const user = auth.currentUser;
            // Update other fields in Firestore
        userDocRef.update(updates)
            .then(() => {
                // Fetch updated data and refresh the display
                return userDocRef.get();
            })
            .then((doc) => {
                currentUserData = doc.data();
                cancelEditing();
                displayUserData();
                alert('Profile updated successfully.');
            })
            .catch((error) => {
                console.error('Error updating profile:', error);
                alert('Error updating profile: ' + error.message);
        });
    }

    // Function to handle password change
    function changePassword() {
        const user = auth.currentUser;

        // Prompt for new password
        const newPassword = prompt('Please enter your new password:');

        if (!newPassword) {
            alert('Password change canceled.');
            return;
        }

        // Reauthenticate the user
        reauthenticateUser()
            .then(() => {
                // Proceed to update the password
                return user.updatePassword(newPassword);
            })
            .then(() => {
                alert('Password updated successfully.');
            })
            .catch((error) => {
                console.error('Error updating password:', error);
                alert('Error updating password: ' + error.message);
            });
    }

    // Function to reauthenticate the user
    function reauthenticateUser() {
        const user = auth.currentUser;
        const providerId = user.providerData[0].providerId;

        if (providerId === 'password') {
            // For email/password users
            const currentPassword = prompt('Please enter your current password for verification:');
            if (!currentPassword) {
                return Promise.reject(new Error('Reauthentication canceled.'));
            }
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            return user.reauthenticateWithCredential(credential);
        } else if (providerId === 'google.com') {
            // For Google users
            const provider = new firebase.auth.GoogleAuthProvider();
            return user.reauthenticateWithPopup(provider);
        } else {
            // Handle other providers if necessary
            return Promise.reject(new Error('Reauthentication not supported for this provider.'));
        }
    }
});
