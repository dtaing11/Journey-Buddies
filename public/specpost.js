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

// Function to get query parameter by name
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Listen for authentication state changes
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, proceed to fetch event details
    fetchEventDetails();
  } else {
    // User is not signed in, optionally redirect or show a message
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

  // Fetch all groups
  eventDocRef.collection('groups').get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        groupsListDiv.innerHTML = '<p>No groups found for this event.</p>';
        return;
      }

      // Collect all unique userIds from groups
      const allUserIds = [];
      querySnapshot.forEach(doc => {
        const groupData = doc.data();
        if (groupData.userIds && Array.isArray(groupData.userIds)) {
          allUserIds.push(...groupData.userIds);
        }
      });

      const uniqueUserIds = [...new Set(allUserIds)];

      if (uniqueUserIds.length === 0) {
        // No members in any groups
        querySnapshot.forEach(groupDoc => {
          const groupData = groupDoc.data();
          displayGroup(groupData);
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

      return Promise.all(userFetchPromises)
        .then(userSnapshots => {
          const userIdToUsername = {};
          userSnapshots.forEach(userSnapshot => {
            userSnapshot.forEach(userDoc => {
              const userData = userDoc.data();
              // Ensure correct field name 'UserName'
              userIdToUsername[userDoc.id] = userData.UserName || 'Unknown';
            });
          });

          // Now iterate over groups and display
          querySnapshot.forEach(groupDoc => {
            const groupData = groupDoc.data();
            displayGroup(groupData, userIdToUsername);
          });
        });
    })
    .catch((error) => {
      console.error('Error fetching groups:', error);
      groupsListDiv.innerHTML = '<p>Error loading groups. Please try again later.</p>';
    });
}

// Function to Display a Single Group
function displayGroup(groupData, userIdToUsername = {}) {
  const groupName = groupData.groupName || 'No Group Name';
  const groupDescription = groupData.description || 'No Description';
  const userIds = groupData.userIds || [];
  const maxPeople = groupData.maxPeople || 0;

  // Get usernames
  const usernames = userIds.map(uid => userIdToUsername[uid] || 'Unknown');

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
  membersElem.textContent = `Members: ${usernames.join(', ') || 'None'}`;

  const memberCountElem = document.createElement('p');
  memberCountElem.classList.add('card-text');
  memberCountElem.textContent = `Member Count: ${userIds.length}/${maxPeople}`;

  cardBody.appendChild(groupTitle);
  cardBody.appendChild(groupDescriptionElem);
  cardBody.appendChild(membersElem);
  cardBody.appendChild(memberCountElem);

  groupCard.appendChild(cardBody);
  groupsListDiv.appendChild(groupCard);
}

// Handle Create Group Form Submission
function handleCreateGroup(event) {
  event.preventDefault(); // Prevent default form submission

  // Get input values
  const groupName = document.getElementById('groupName').value.trim();
  const groupDescription = document.getElementById('groupDescription').value.trim();
  const maxPeople = parseInt(document.getElementById('maxPeople').value.trim());

  // Basic validation
  if (!groupName || !groupDescription || isNaN(maxPeople) || maxPeople < 1) {
    formFeedback.innerHTML = '<div class="alert alert-danger">Please provide valid group details.</div>';
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

  // Check for duplicate group name
  eventDocRef.collection('groups').where('groupName', '==', groupName).get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        throw new Error('A group with this name already exists.');
      }
      // Proceed to add the group
      return eventDocRef.collection('groups').add(groupData);
    })
    .then((docRef) => {
      // Optionally, update the 'group_ID' array in the event document with the new group ID
      return eventDocRef.update({
        group_ID: firebase.firestore.FieldValue.arrayUnion(docRef.id)
      });
    })
    .then(() => {
      // Provide success feedback
      formFeedback.innerHTML = '<div class="alert alert-success">Group created successfully!</div>';
      // Reset the form
      createGroupForm.reset();
      // Refresh the groups list
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
