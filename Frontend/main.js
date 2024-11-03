const auth = firebase.auth();
const db = firebase.firestore();

// // Get references to the button elements
const homeBtn = document.getElementById('homeBtn');
// const mapBtn = document.getElementById('mapBtn');
// const postsBtn = document.getElementById('postsBtn');
// const reelsBtn = document.getElementById('reelsBtn');
// const groupsBtn = document.getElementById('groupsBtn');
// const inboxBtn = document.getElementById('inboxBtn');
// const postBtn = document.getElementById('postBtn');

// // Get references to the div elements
const homeDiv = document.getElementById('home');
// const mapDiv = document.getElementById('map');
// const postsDiv = document.getElementById('posts');
// const reelsDiv = document.getElementById('reels');
// const groupsDiv = document.getElementById('groups');
// const inboxDiv = document.getElementById('inbox');

// // Function to hide all divs
function hideAllDivs() {
    homeDiv.hidden = true;
    // mapDiv.hidden = true;
    // postsDiv.hidden = true;
    // reelsDiv.hidden = true;
    // groupsDiv.hidden = true;
    // inboxDiv.hidden = true;
}

// // Event listeners for buttons
homeBtn.addEventListener('click', () => {
    hideAllDivs();
    homeDiv.hidden = false;
});

// mapBtn.addEventListener('click', () => {
//     hideAllDivs();
//     mapDiv.hidden = false;
// });

// postsBtn.addEventListener('click', () => {
//     hideAllDivs();
//     postsDiv.hidden = false;
// });

// reelsBtn.addEventListener('click', () => {
//     hideAllDivs();
//     reelsDiv.hidden = false;
// });

// groupsBtn.addEventListener('click', () => {
//     hideAllDivs();
//     groupsDiv.hidden = false;
// });

// inboxBtn.addEventListener('click', () => {
//     hideAllDivs();
//     inboxDiv.hidden = false;
// });
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

const groupsDiv = document.getElementById('groupsDiv');

document.addEventListener('DOMContentLoaded', fetchEvents);
//-------------------------------------------
// Get references to the new HTML elements
const groupsList = document.getElementById('groups');
// Function to fetch all groups using a collection group query
function fetchAllGroups() {
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
groupsBtn.addEventListener('click', () => {
    hideAllDivs();
    homeDiv.hidden = true;
    groupsDiv.hidden = false;
    fetchAllGroups();
});
