// Wait for the window to load
window.addEventListener('load', () => {
    // Get the userId from query parameters
    const userId = getQueryParam('userId');
    const profileContainer = document.getElementById('profile-container');

    if (!userId) {
        profileContainer.innerHTML = '<p>No user ID provided.</p>';
        return;
    }

    // Initialize Firebase services
    const db = firebase.firestore();

    // Fetch user data
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (!doc.exists) {
                profileContainer.innerHTML = '<p>User not found.</p>';
                return;
            }

            const userData = doc.data();
            displayUserProfile(userData);
        })
        .catch((error) => {
            console.error('Error fetching user data:', error);
            profileContainer.innerHTML = '<p>Error loading profile. Please try again later.</p>';
        });
});

// Function to get query parameter by name
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to display user profile
function displayUserProfile(userData) {
    const profileContainer = document.getElementById('profile-container');

    const username = userData.UserName || 'No Username';
    const email = userData.UserEmail || 'No Email';
    const description = userData.Description || 'No Description Provided.';
    const userImage = userData.UserImage || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    const profileImage = document.createElement('img');
    profileImage.src = userImage;
    profileImage.alt = `${username}'s Profile Picture`;
    profileImage.classList.add('img-thumbnail');
    profileImage.style.width = '200px';
    profileImage.style.height = '200px';

    const usernameElem = document.createElement('h3');
    usernameElem.textContent = username;

    const emailElem = document.createElement('p');
    emailElem.innerHTML = `<strong>Email:</strong> ${email}`;

    const descriptionElem = document.createElement('p');
    descriptionElem.innerHTML = `<strong>Description:</strong> ${description}`;

    // Append all elements to the profile container
    profileContainer.appendChild(profileImage);
    profileContainer.appendChild(usernameElem);
    profileContainer.appendChild(emailElem);
    profileContainer.appendChild(descriptionElem);
}
