const db = firebase.firestore();
const eventDetailDiv = document.getElementById('eventDetail');

// Function to get query parameter by name
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function fetchEventDetails() {
  const pictureUrl = getQueryParam('picture');

  if (!pictureUrl) {
    eventDetailDiv.innerHTML = '<p>No picture URL provided.</p>';
    return;
  }

  // Query Firestore for the event with the matching picture URL
  db.collection('events').where('picture', '==', pictureUrl).get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        eventDetailDiv.innerHTML = '<p>No event found with the provided picture.</p>';
        return;
      }

      // Assuming picture URLs are unique, retrieve the first matching document
      const doc = querySnapshot.docs[0];
      const data = doc.data();

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

      const groupIdElement = document.createElement('p');
      groupIdElement.textContent = `Group IDs: ${group_ID.join(', ') || 'None'}`;

      const likesIdElement = document.createElement('p');
      likesIdElement.textContent = `Likes IDs: ${likes_ID.join(', ') || 'None'}`;

      const userpostIdElement = document.createElement('p');
      userpostIdElement.textContent = `Userpost IDs: ${userpost_ID.join(', ') || 'None'}`;

      const eventImage = document.createElement('img');
      eventImage.src = picture;
      eventImage.alt = eventName;

      // Append all elements to the eventDetailDiv
      eventDetailDiv.appendChild(eventTitle);
      eventDetailDiv.appendChild(eventDateElement);
      eventDetailDiv.appendChild(eventLocationElement);
      eventDetailDiv.appendChild(eventDescription1Element);
      eventDetailDiv.appendChild(eventDescription2Element);
      eventDetailDiv.appendChild(groupIdElement);
      eventDetailDiv.appendChild(likesIdElement);
      eventDetailDiv.appendChild(userpostIdElement);
      eventDetailDiv.appendChild(eventImage);
    })
    .catch((error) => {
      console.error('Error fetching event details:', error);
      eventDetailDiv.innerHTML = '<p>Error loading event details. Please try again later.</p>';
    });
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchEventDetails);