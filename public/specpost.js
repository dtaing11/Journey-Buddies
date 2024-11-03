// Initialize Firestore
const db = firebase.firestore();
const eventDetailDiv = document.getElementById('eventDetail');

// Reference to the form and feedback div
const createGroupForm = document.getElementById('createGroupForm');
const formFeedback = document.getElementById('formFeedback');

// Reference to the groups list div
const groupsListDiv = document.getElementById('groupsList');

// Variable to store the current event's Firestore document reference
let eventDocRef = null;

// Variable to store the current user's ID
let currentUserId = null;

// Function to get query parameter by name
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Listen for authentication state changes
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, store the user ID and proceed to fetch event details
    currentUserId = user.uid;
    fetchEventDetails();
  } else {
    // User is not signed in, display a message
    eventDetailDiv.innerHTML = '<p>Please log in to view event details and create groups.</p>';
    groupsListDiv.innerHTML = '';
  }
});

// Fetch and Display Event Details
function fetchEventDetails() {
  const pictureUrl = getQueryParam('picture');

  if (!pictureUrl) {
    eventDetailDiv.innerHTML = '<p>No picture URL provided.</p>';
    groupsListDiv.innerHTML = '';
    return;
  }

  // Query Firestore for the event with the matching picture URL
  db.collection('events').where('picture', '==', pictureUrl).get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        eventDetailDiv.innerHTML = '<p>No event found with the provided picture.</p>';
        groupsListDiv.innerHTML = '';
        return;
      }

      // Assuming picture URLs are unique, retrieve the first matching document
      const doc = querySnapshot.docs[0];
      const data = doc.data();

      // Assign the event document reference
      eventDocRef = doc.ref;

      // Access all event fields
      const eventName = data.event_name || 'No Event Name';
      const eventLocation = data.event_location || 'No Location';
      const eventDescription1 = data.description1 || '';
      const eventDescription2 = data.description2 || '';
      const dateString = data.date || 'No Date Provided';
      const group_ID = data.group_ID || [];
      const likes_ID = data.likes_ID || [];
      const userpost_ID = data.userpost_ID || [];
      const picture = data.picture || 'https://via.placeholder.com/800x400?text=No+Image';
      const safety = data.safety_tips || [];

      // Convert date string to JavaScript Date object
      let eventDate;
      if (dateString !== 'No Date Provided') {
        eventDate = new Date(dateString);
        if (isNaN(eventDate)) {
          // Handle invalid date formats
          eventDate = new Date(); // Default to current date
        }
      } else {
        eventDate = new Date(); // Default to current date if no date provided
      }

      // Create and append event details
      eventDetailDiv.innerHTML = ''; // Clear existing content

      const eventTitle = document.createElement('h2');
      eventTitle.textContent = eventName;

      const eventDateElement = document.createElement('p');
      eventDateElement.textContent = `Date: ${eventDate.toDateString()}`;

      const eventLocationElement = document.createElement('p');
      eventLocationElement.textContent = `Location: ${eventLocation}`;

      const eventDescription1Element = document.createElement('p');
      eventDescription1Element.textContent = `Description 1: ${eventDescription1}`;

      const eventDescription2Element = document.createElement('p');
      eventDescription2Element.textContent = `Description 2: ${eventDescription2}`;

      // Create Safety Tips with Ordered List
      const safetyContainer = document.createElement('div');

      // Title for Safety Tips
      const safetyTitle = document.createElement('p');
      safetyTitle.textContent = 'Safety Tips:';
      safetyContainer.appendChild(safetyTitle);

      // Create the ordered list
      const ol = document.createElement('ol');

      // Populate the ordered list with safety tips
      safety.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        ol.appendChild(li);
      });

      // Append the ordered list to the container
      safetyContainer.appendChild(ol);

      const groupIdElement = document.createElement('p');
      groupIdElement.textContent = `Group IDs: ${group_ID.join(', ') || 'None'}`;

      const likesIdElement = document.createElement('p');
      likesIdElement.textContent = `Likes IDs: ${likes_ID.join(', ') || 'None'}`;

      const userpostIdElement = document.createElement('p');
      userpostIdElement.textContent = `Userpost IDs: ${userpost_ID.join(', ') || 'None'}`;

      const eventImage = document.createElement('img');
      eventImage.src = picture;
      eventImage.alt = eventName;
      eventImage.style.width = '100%'; // Optional: Adjust image styling as needed

      // Append all elements to the eventDetailDiv
      eventDetailDiv.appendChild(eventTitle);
      eventDetailDiv.appendChild(eventDateElement);
      eventDetailDiv.appendChild(eventLocationElement);
      eventDetailDiv.appendChild(eventDescription1Element);
      eventDetailDiv.appendChild(eventDescription2Element);
      eventDetailDiv.appendChild(safetyContainer);
      eventDetailDiv.appendChild(groupIdElement);
      eventDetailDiv.appendChild(likesIdElement);
      eventDetailDiv.appendChild(userpostIdElement);
      eventDetailDiv.appendChild(eventImage);

      // Fetch and Display Groups
      fetchAndDisplayGroups();
   });
}

// Function to Fetch and Display Groups
function fetchAndDisplayGroups() {
  if (!eventDocRef) {
    console.error('eventDocRef is null. Cannot fetch groups.');
    return;
  }

  // Clear any existing content
  groupsListDiv.innerHTML = '';

  // Fetch all groups that are not full
  eventDocRef.collection('groups').get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        groupsListDiv.innerHTML = '<p>No groups found for this event.</p>';
        return;
      }

      // Collect all unique userIds from groups and filter groups that are not full
      const allUserIds = [];
      const validGroups = [];

      querySnapshot.forEach(doc => {
        const groupData = doc.data();
        const userIds = groupData.userIds || [];
        const maxPeople = groupData.maxPeople || 0;

        // Only include groups that are not full
        if (userIds.length < maxPeople) {
          validGroups.push({ id: doc.id, ...groupData });
          allUserIds.push(...userIds);
        }
      });

      if (validGroups.length === 0) {
        groupsListDiv.innerHTML = '<p>No available groups to join.</p>';
        return;
      }

      const uniqueUserIds = [...new Set(allUserIds)];

      if (uniqueUserIds.length === 0) {
        // No members in any groups
        validGroups.forEach(group => {
          displayGroup(group);
        });
        return;
      }

      // Firestore 'in' queries can handle up to 10 elements. If more, batch them.
      const batches = [];
      const batchSize = 10;
      for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        const batch = uniqueUserIds.slice(i, i + batchSize);
        batches.push(batch);
      }

      // Fetch all user documents in batches
      const userFetchPromises = batches.map(batch =>
        db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', batch).get()
      );

      Promise.all(userFetchPromises)
        .then(userSnapshots => {
          const userIdToUsername = {};
          userSnapshots.forEach(userSnapshot => {
            userSnapshot.forEach(userDoc => {
              const userData = userDoc.data();
              // Ensure correct field name 'UserName'
              userIdToUsername[userDoc.id] = userData.UserName || 'Unknown';
            });
          });

          // Now iterate over valid groups and display
          validGroups.forEach(group => {
            displayGroup(group, userIdToUsername);
          });
        })
        .catch((error) => {
          console.error('Error fetching group members:', error);
          groupsListDiv.innerHTML = '<p>Error loading group members. Please try again later.</p>';
        });
    })
    .catch((error) => {
      console.error('Error fetching groups:', error);
      groupsListDiv.innerHTML = '<p>Error loading groups. Please try again later.</p>';
    });
}

// Function to Display a Single Group
function displayGroup(groupData, userIdToUsername = {}) {
  const groupId = groupData.id;
  const groupName = groupData.groupName || 'No Group Name';
  const groupDescription = groupData.description || 'No Description';
  const userIds = groupData.userIds || [];
  const maxPeople = groupData.maxPeople || 0;

  // Get usernames
  const usernames = userIds.map(uid => userIdToUsername[uid] || 'Unknown');

  // Check if the current user is a member of the group
  const isMember = userIds.includes(currentUserId);

  // Determine if the current user is at index 1 (group leader)
  let isDisbandAllowed = false;
  if (isMember) {
    const userIndex = userIds.indexOf(currentUserId);
    if (userIndex === 0) { // Zero-based index; index 1 is the second member
      isDisbandAllowed = true;
    }
  }

  // Create group card
  const groupCard = document.createElement('div');
  groupCard.classList.add('card', 'mb-3');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const groupTitle = document.createElement('h5');
  groupTitle.classList.add('card-title');
  groupTitle.textContent = groupName;

  const groupDescriptionElem = document.createElement('p');
  groupDescriptionElem.classList.add('card-text');
  groupDescriptionElem.textContent = groupDescription;

  const membersElem = document.createElement('p');
  membersElem.classList.add('card-text');
  membersElem.textContent = `Members: `;

  // Create a container for member names and profile buttons
  const membersContainer = document.createElement('span');

  userIds.forEach(uid => {
    const username = userIdToUsername[uid] || 'Unknown';

    // Create a span for each member
    const memberSpan = document.createElement('span');
    memberSpan.style.marginRight = '10px';

    // Add the username text
    const nameText = document.createElement('span');
    nameText.textContent = username;
    memberSpan.appendChild(nameText);

    // Add the "View Profile" button
    const profileButton = document.createElement('button');
    profileButton.textContent = 'View Profile';
    profileButton.classList.add('btn', 'btn-link', 'btn-sm'); // Styled as a link
    profileButton.style.padding = '0';
    profileButton.style.marginLeft = '5px';
    profileButton.style.fontSize = '0.9em';

    // Set the button to navigate to the profile page with the user's ID
    profileButton.addEventListener('click', () => {
      window.location.href = `profile_other.html?userId=${uid}`;
    });

    memberSpan.appendChild(profileButton);
    membersContainer.appendChild(memberSpan);
  });

  membersElem.appendChild(membersContainer);

  const memberCountElem = document.createElement('p');
  memberCountElem.classList.add('card-text');
  memberCountElem.textContent = `Member Count: ${userIds.length}/${maxPeople}`;

  // Create Join, Leave, or Disband button
  let actionButton = document.createElement('button');

  if (isMember) {
    if (isDisbandAllowed) {
      actionButton.textContent = 'Disband Group';
      actionButton.classList.add('btn', 'btn-danger', 'mt-2');
      actionButton.addEventListener('click', () => {
        handleDisbandGroup(groupId);
      });
    } else {
      actionButton.textContent = 'Leave Group';
      actionButton.classList.add('btn', 'btn-warning', 'mt-2');
      actionButton.addEventListener('click', () => {
        handleLeaveGroup(groupId);
      });
    }
  } else {
    actionButton.textContent = 'Join Group';
    actionButton.classList.add('btn', 'btn-primary', 'mt-2');
    actionButton.addEventListener('click', () => {
      handleJoinGroup(groupId);
    });
  }

  // Append elements to card body
  cardBody.appendChild(groupTitle);
  cardBody.appendChild(groupDescriptionElem);
  cardBody.appendChild(membersElem); // Updated to include profile buttons
  cardBody.appendChild(memberCountElem);
  cardBody.appendChild(actionButton);

  groupCard.appendChild(cardBody);
  groupsListDiv.appendChild(groupCard);
}

// Function to Handle Joining a Group
function handleJoinGroup(groupId) {
  if (!eventDocRef) {
    alert('Event reference not found.');
    return;
  }

  const groupRef = eventDocRef.collection('groups').doc(groupId);

  // Use a transaction to ensure atomicity
  db.runTransaction((transaction) => {
    return transaction.get(groupRef).then((doc) => {
      if (!doc.exists) {
        throw new Error('Group does not exist.');
      }

      const groupData = doc.data();
      const userIds = groupData.userIds || [];
      const maxPeople = groupData.maxPeople || 0;

      if (userIds.includes(currentUserId)) {
        throw new Error('You are already a member of this group.');
      }

      if (userIds.length >= maxPeople) {
        throw new Error('This group is already full.');
      }

      // Add user ID to the group
      transaction.update(groupRef, {
        userIds: firebase.firestore.FieldValue.arrayUnion(currentUserId)
      });
    });
  })
  .then(() => {
    alert('Successfully joined the group!');
    // Refresh the groups list to update the buttons
    fetchAndDisplayGroups();
  })
  .catch((error) => {
    console.error('Error joining group:', error);
    alert(error.message || 'Error joining group. Please try again.');
  });
}

// Function to Handle Leaving a Group
function handleLeaveGroup(groupId) {
  if (!eventDocRef) {
    alert('Event reference not found.');
    return;
  }

  const groupRef = eventDocRef.collection('groups').doc(groupId);

  // Confirmation before leaving
  const confirmLeave = confirm('Are you sure you want to leave this group?');
  if (!confirmLeave) {
    return;
  }

  // Use a transaction to ensure atomicity
  db.runTransaction((transaction) => {
    return transaction.get(groupRef).then((doc) => {
      if (!doc.exists) {
        throw new Error('Group does not exist.');
      }

      const groupData = doc.data();
      const userIds = groupData.userIds || [];

      if (!userIds.includes(currentUserId)) {
        throw new Error('You are not a member of this group.');
      }

      // Remove user ID from the group
      transaction.update(groupRef, {
        userIds: firebase.firestore.FieldValue.arrayRemove(currentUserId)
      });
    });
  })
  .then(() => {
    alert('Successfully left the group.');
    // Refresh the groups list to update the buttons
    fetchAndDisplayGroups();
  })
  .catch((error) => {
    console.error('Error leaving group:', error);
    alert(error.message || 'Error leaving group. Please try again.');
  });
}

// Function to Handle Disbanding a Group
function handleDisbandGroup(groupId) {
  if (!eventDocRef) {
    alert('Event reference not found.');
    return;
  }

  const groupRef = eventDocRef.collection('groups').doc(groupId);

  // Confirmation before disbanding
  const confirmDisband = confirm('Are you sure you want to disband this group? This action cannot be undone.');
  if (!confirmDisband) {
    return;
  }

  // Use a transaction to ensure atomicity
  db.runTransaction((transaction) => {
    return transaction.get(groupRef).then((doc) => {
      if (!doc.exists) {
        throw new Error('Group does not exist.');
      }

      const groupData = doc.data();
      const userIds = groupData.userIds || [];

      // Verify that the current user is indeed the leader
      if (userIds[0] !== currentUserId) {
        throw new Error('Only the group leader can disband the group.');
      }

      // Delete the group document
      transaction.delete(groupRef);

      // Remove the group ID from the event's group_ID array
      transaction.update(eventDocRef, {
        group_ID: firebase.firestore.FieldValue.arrayRemove(groupId)
      });
    });
  })
  .then(() => {
    alert('Group has been disbanded successfully.');
    // Refresh the groups list to reflect the deletion
    fetchAndDisplayGroups();
  })
  .catch((error) => {
    console.error('Error disbanding group:', error);
    alert(error.message || 'Error disbanding group. Please try again.');
  });
}

// Function to Handle Creating a Group
function handleCreateGroup(event) {
    event.preventDefault(); // Prevent default form submission
  
    // Get input values
    const groupName = document.getElementById('groupName').value.trim();
    const groupDescription = document.getElementById('groupDescription').value.trim();
    const maxPeople = parseInt(document.getElementById('maxPeople').value.trim());
  
    // Basic validation
    if (!groupName || !groupDescription || isNaN(maxPeople) || maxPeople < 2 || maxPeople > 16) {
      formFeedback.innerHTML = '<div class="alert alert-danger">Please provide valid group details. Max People should be between 2 and 16.</div>';
      return;
    }
  
    // Get the current user
    const user = firebase.auth().currentUser;
  
    if (!user) {
      formFeedback.innerHTML = '<div class="alert alert-warning">You must be logged in to create a group.</div>';
      return;
    }
  
    const userId = user.uid;
  
    // Prepare group data
    const groupData = {
      groupName: groupName,
      description: groupDescription,
      maxPeople: maxPeople,
      userIds: [userId], // Initialize with the current user's ID
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
  
    // Disable the Create Group button to prevent multiple submissions
    const createButton = createGroupForm.querySelector('button[type="submit"]');
    createButton.disabled = true;
    createButton.textContent = 'Creating...';
  
    // Reference to the group document using groupName as the ID to enforce uniqueness
    const groupRef = eventDocRef.collection('groups').doc(groupName);
  
    // Run a transaction to ensure the group does not already exist
    db.runTransaction((transaction) => {
      return transaction.get(groupRef).then((doc) => {
        if (doc.exists) {
          throw new Error('A group with this name already exists.');
        }
        transaction.set(groupRef, groupData);
        // Optionally, update the 'group_ID' array in the event document with the new group ID
        // transaction.update(eventDocRef, {
        //   group_ID: firebase.firestore.FieldValue.arrayUnion(groupRef.id)
        // });
      });
    })
    .then(() => {
      // Provide success feedback
      formFeedback.innerHTML = '<div class="alert alert-success">Group created successfully!</div>';
      // Reset the form
      createGroupForm.reset();
      // Refresh the groups list to include the new group
      fetchAndDisplayGroups();
    })
    .catch((error) => {
      console.error('Error creating group:', error);
      // Provide error feedback
      formFeedback.innerHTML = `<div class="alert alert-danger">${error.message || 'Error creating group. Please try again later.'}</div>`;
    })
    .finally(() => {
      // Re-enable the Create Group button
      createButton.disabled = false;
      createButton.textContent = 'Create A Group!';
    });
  }  

// Attach Event Listener to the Form
createGroupForm.addEventListener('submit', handleCreateGroup);
