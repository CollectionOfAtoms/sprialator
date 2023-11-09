// Get the overlay element
var overlay = document.getElementById('overlay');

// Initialize a variable to hold the timeout ID
var cursorHideTimeout;

// Function to hide the cursor
function hideCursor() {
    overlay.style.cursor = 'none';
}

// Function to show the cursor and clear the existing timeout
function showCursor() {
    clearTimeout(cursorHideTimeout); // Clear any existing timeout to hide the cursor
    overlay.style.cursor = 'default'; // Show the cursor
    cursorHideTimeout = setTimeout(hideCursor, 2000); // Set a new timeout to hide the cursor after 2 seconds
}

// Add the mousemove event listener
overlay.addEventListener('mousemove', showCursor);

// Initialize the cursor hide sequence when the mouse first moves over the overlay
showCursor();