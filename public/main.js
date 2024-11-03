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

                        // Create a welcome notification
                        db.collection('users').doc(userCredential.user.uid)
                          .collection('notifications').add({
                              message: `Welcome to Journey Buddies, ${username}!`,
                              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                              read: false
                          })
                          .then(() => {
                              console.log("Welcome notification created.");
                              showUserDetails(userCredential.user);
                          })
                          .catch(error => {
                              console.error("Error creating welcome notification:", error);
                          });
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
    db.collection('events').get()
      .then((querySnapshot) => {
        const eventsArray = [];
  
        querySnapshot.forEach((doc) => {
          const data = doc.data();
  
          // Access existing fields and parse date
          const eventName = data.event_name || 'No Event Name';
          const eventLocation = data.event_location || 'No Location';
          const eventDescription = data.description1 || data.description2 || 'No Description';
          const dateString = data.date || 'No Date Provided';
          const pictureUrl = data.picture || 'default-image-url.jpg';
  
          let eventDate;
          if (dateString !== 'No Date Provided') {
            eventDate = new Date(dateString);
          } else {
            eventDate = new Date(); // Default to current date if no date provided
          }
  
          // Create an event object
          const eventObject = {
            eventName,
            eventLocation,
            eventDescription,
            eventDate,
            pictureUrl
          };
  
          // Add to events array
          eventsArray.push(eventObject);
        });
  
        // Sort eventsArray by eventDate in descending order
        eventsArray.sort((a, b) => b.eventDate - a.eventDate);
  
        // Clear the home div
        homeDiv.innerHTML = '';
  
        // Display sorted events
        eventsArray.forEach((event) => {
          const eventContainer = document.createElement('div');
          eventContainer.classList.add('event');
  
          const eventTitle = document.createElement('h3');
          eventTitle.textContent = event.eventName;
  
          const eventDateElement = document.createElement('p');
          eventDateElement.textContent = `Date: ${event.eventDate.toDateString()}`;
  
          const eventLocationElement = document.createElement('p');
          eventLocationElement.textContent = `Location: ${event.eventLocation}`;
  
          const eventDescriptionElement = document.createElement('p');
          eventDescriptionElement.textContent = event.eventDescription;
  
          const eventImage = document.createElement('img');
          eventImage.src = event.pictureUrl;

          const viewDetailsButton = document.createElement('button');
          viewDetailsButton.textContent = 'View Details';
          viewDetailsButton.classList.add('btn', 'btn-primary', 'mt-2');
  
          eventContainer.appendChild(eventTitle);
          eventContainer.appendChild(eventDateElement);
          eventContainer.appendChild(eventLocationElement);
          eventContainer.appendChild(eventDescriptionElement);
          eventContainer.appendChild(eventImage);
          eventContainer.appendChild(viewDetailsButton);

          viewDetailsButton.onclick = () => {
            window.location.href = `specpost.html?picture=${encodeURIComponent(event.pictureUrl)}`;
          };
  
          homeDiv.appendChild(eventContainer);
        });
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
      });
  }

document.addEventListener('DOMContentLoaded', listenForPosts);
document.addEventListener('DOMContentLoaded', fetchEvents);













//-------------------------------------------










// Get references to the new HTML elements
const groupsList = document.getElementById('groups');
const chatInterface = document.getElementById('chatInterface');
const chatGroupName = document.getElementById('chatGroupName');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const closeChatBtn = document.getElementById('closeChatBtn');

// Function to fetch all groups using a collection group query
function fetchAllGroups() {
    // Clear any existing groups
    groupsList.innerHTML = '';

    db.collectionGroup('groups').get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                groupsList.innerHTML = '<p>No groups found.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const groupData = doc.data();
                const groupId = doc.id;
                const eventId = doc.ref.parent.parent.id; // Assuming 'groups' is a subcollection under 'events'

                // Create a group item as a button for better semantics
                const groupItem = document.createElement('button');
                groupItem.type = 'button';
                groupItem.classList.add('list-group-item', 'list-group-item-action', 'btn', 'btn-link');
                groupItem.textContent = groupData.groupName;
                groupItem.dataset.groupId = groupId;
                groupItem.dataset.eventId = eventId;

                // Add click event to open chat
                groupItem.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent default anchor behavior
                    openChat(eventId, groupId, groupData.groupName);
                });

                groupsList.appendChild(groupItem);
            });
        })
        .catch((error) => {
            console.error('Error fetching groups:', error);
            groupsList.innerHTML = '<p>Error fetching groups. Please try again later.</p>';
        });
}


// Function to open chat for a specific group
function openChat(eventId, groupId, groupName) {
    // Show chat interface
    chatInterface.hidden = false;
    chatGroupName.textContent = `Chat - ${groupName}`;

    // Clear previous messages
    chatMessages.innerHTML = '';

    // Reference to the messages subcollection
    const messagesRef = db.collection('events').doc(eventId)
                            .collection('groups').doc(groupId)
                            .collection('messages');

    // Listen for real-time updates to messages
    messagesRef.orderBy('createdAt').onSnapshot((snapshot) => {
        chatMessages.innerHTML = ''; // Clear existing messages

        snapshot.forEach((doc) => {
            const messageData = doc.data();
            const messageElement = document.createElement('div');
            messageElement.innerHTML = `<strong>${messageData.senderName}:</strong> ${messageData.text}`;
            chatMessages.appendChild(messageElement);
        });

        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, (error) => {
        console.error('Error fetching messages:', error);
    });

    // Handle chat form submission
    chatForm.onsubmit = (e) => {
        e.preventDefault();
        const messageText = chatInput.value.trim();
        if (messageText === '') return;

        const user = firebase.auth().currentUser;
        if (!user) {
            alert('You must be signed in to send messages.');
            return;
        }

        // Get the user's display name
        const userDocRef = db.collection('users').doc(user.uid);
        userDocRef.get().then((doc) => {
            const userData = doc.data();
            const senderName = userData.UserName || 'Anonymous';

            // Add message to Firestore
            messagesRef.add({
                text: messageText,
                senderId: user.uid,
                senderName: senderName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                chatInput.value = '';
            })
            .catch((error) => {
                console.error('Error sending message:', error);
            });
        }).catch((error) => {
            console.error('Error fetching user data:', error);
        });
    };
}

// Handle closing the chat
closeChatBtn.addEventListener('click', () => {
    chatInterface.hidden = true;
    chatGroupName.textContent = '';
    chatMessages.innerHTML = '';
    chatForm.onsubmit = null; // Remove the submit handler
});

// Update the event listener for the Groups button to fetch groups when clicked
groupsBtn.addEventListener('click', () => {
    hideAllDivs();
    groupsDiv.hidden = false;
    fetchAllGroups();
});





//---------------------------------------------------









// Function to join a group
function joinGroup(eventId, groupId, groupName) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('You must be signed in to join groups.');
        return;
    }

    const userDocRef = db.collection('users').doc(user.uid);
    const groupDocRef = db.collection('events').doc(eventId)
                             .collection('groups').doc(groupId);

    // Add user to the group's members array
    groupDocRef.update({
        members: firebase.firestore.FieldValue.arrayUnion(user.uid)
    })
    .then(() => {
        console.log(`User ${user.uid} joined group ${groupId}`);

        // Create a notification for the user
        userDocRef.collection('notifications').add({
            message: `You have joined the group "${groupName}".`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        })
        .then(() => {
            console.log("Group join notification created for user.");
        })
        .catch(error => {
            console.error("Error creating group join notification for user:", error);
        });

        // Notify existing group members
        groupDocRef.get().then(doc => {
            if (doc.exists) {
                const groupData = doc.data();
                const memberIds = groupData.members || [];

                // Exclude the current user from notifications
                const otherMembers = memberIds.filter(id => id !== user.uid);

                otherMembers.forEach(memberId => {
                    db.collection('users').doc(memberId)
                      .collection('notifications').add({
                          message: `${groupData.groupName} has a new member: ${user.displayName || user.email}.`,
                          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                          read: false
                      })
                      .then(() => {
                          console.log(`Notification sent to user ${memberId}`);
                      })
                      .catch(error => {
                          console.error(`Error sending notification to user ${memberId}:`, error);
                      });
                });
            } else {
                console.error("Group document does not exist.");
            }
        }).catch(error => {
            console.error("Error fetching group data:", error);
        });
    })
    .catch(error => {
        console.error("Error joining group:", error);
        alert("An error occurred while joining the group. Please try again.");
    });
}

// References to Inbox elements
const inboxDiv = document.getElementById('inbox');
const notificationList = document.getElementById('notificationList');

// Function to fetch and display notifications
function fetchNotifications() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log("No user is signed in.");
        return;
    }

    const notificationsRef = db.collection('users').doc(user.uid)
                              .collection('notifications').orderBy('timestamp', 'desc');

    // Listen for real-time updates
    notificationsRef.onSnapshot(snapshot => {
        notificationList.innerHTML = ''; // Clear existing notifications

        if (snapshot.empty) {
            notificationList.innerHTML = '<li class="list-inbox-item">No notifications.</li>';
            return;
        }

        snapshot.forEach(doc => {
            const notification = doc.data();
            const notificationItem = document.createElement('li');
            notificationItem.classList.add('list-inbox-item', 'notification-item');
            if (!notification.read) {
                notificationItem.classList.add('unread');
            }

            // Format the timestamp
            let timeString = '';
            if (notification.timestamp) {
                const date = notification.timestamp.toDate();
                timeString = date.toLocaleString();
            } else {
                timeString = 'No timestamp';
            }

            notificationItem.innerHTML = `
                <p>${notification.message}</p>
                <small class="notification-time">${timeString}</small>
            `;

            // Mark as read when clicked
            notificationItem.onclick = () => {
                if (!notification.read) {
                    doc.ref.update({ read: true })
                        .then(() => {
                            notificationItem.classList.remove('unread');
                        })
                        .catch(error => {
                            console.error("Error marking notification as read:", error);
                        });
                }
            };

            notificationList.appendChild(notificationItem);
        });
    }, error => {
        console.error("Error fetching notifications:", error);
        notificationList.innerHTML = '<li class="list-inbox-item">Error loading notifications.</li>';
    });
}

// Fetch notifications when the Inbox is shown
inboxBtn.addEventListener('click', () => {
    hideAllDivs();
    inboxDiv.hidden = false;
    fetchNotifications();
});
