// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Get references to the input elements
const eventForm = document.getElementById('eventForm');
const eventNameInput = document.getElementById('eventName');
const locationNameInput = document.getElementById('locationName');
const eventDateInput = document.getElementById('eventDate');
const eventPictureInput = document.getElementById('eventPicture');
const eventDescriptionInput1 = document.getElementById('eventDescription1');
const eventDescriptionInput2 = document.getElementById('eventDescription2');
// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        checkIfModerator(user.uid);
    } else {
        // No user is signed in
        alert('You must be signed in to access this page.');
        // Redirect to sign-in page or homepage
        window.location.href = 'index.html'; // Adjust this path as needed
    }
});

// Function to check if the user is a moderator
function checkIfModerator(uid) {
    db.collection('users').doc(uid).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.UserName === '0') {
                    // User is a moderator
                    console.log('User is a moderator.');
                    // Optionally, display the form or enable inputs
                } else {
                    // User is not a moderator
                    alert('You do not have permission to access this page.');
                    // Redirect to homepage or show an error message
                    window.location.href = 'index.html'; // Adjust this path as needed
                }
            } else {
                console.error('User document does not exist.');
                alert('User data not found.');
                auth.signOut();
            }
        })
        .catch((error) => {
            console.error('Error fetching user data:', error);
            alert('An error occurred while verifying permissions.');
            auth.signOut();
        });
}

// Handle form submission
eventForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const eventName = eventNameInput.value.trim();
    const locationName = locationNameInput.value.trim();
    const eventDate = eventDateInput.value; // Format: YYYY-MM-DD
    const eventDescription1 = eventDescriptionInput1.value.trim();
    const eventDescription2 = eventDescriptionInput2.value.trim();
    const file = eventPictureInput.files[0];

    if (!eventName || !locationName || !eventDate || !eventDescription1 || !eventDescription2 || !file) {
        alert('Please fill in all fields.');
        return;
    }

    // Upload the picture to Firebase Storage
    const storageRef = storage.ref();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const eventPictureRef = storageRef.child(`event_pictures/${fileName}`);

    const uploadTask = eventPictureRef.put(file);

    uploadTask.on('state_changed',
        (snapshot) => {
            // Optional: Handle upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
        },
        (error) => {
            // Handle upload errors
            console.error('Error uploading picture:', error);
            alert('Error uploading picture: ' + error.message);
        },
        () => {
            // Upload completed successfully
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                // Save event data to Firestore
                const eventData = {
                    event_name: eventName,
                    event_location: locationName,
                    date: eventDate,
                    picture: downloadURL,
                    description1: eventDescription1,
                    description2: eventDescription2,
                    likes_ID: [],
                    userpost_ID: [],
                    group_ID: []
                };

                db.collection('events').add(eventData)
                    .then((docRef) => {
                        console.log('Event posted successfully with ID:', docRef.id);
                        alert('Event posted successfully.');
                        // Reset the form
                        eventForm.reset();
                    })
                    .catch((error) => {
                        console.error('Error posting event:', error);
                        alert('Error posting event: ' + error.message);
                    });
            }).catch((error) => {
                console.error('Error getting download URL:', error);
                alert('Error getting picture URL: ' + error.message);
            });
        }
    );
});
