// Get the current window
const currentWindow = chrome.windows.getCurrent();

// Define the desired width and height for the popup
const desiredWidth = 800;
const desiredHeight = 600;

// Calculate the position to center the popup on the screen
const leftPos = (screen.width - desiredWidth) / 2;
const topPos = (screen.height - desiredHeight) / 2;

// Open the popup with the desired size and position
chrome.windows.create({
	url: "index.html", // Replace 'popup.html' with your actual popup URL
	type: "popup",
	width: desiredWidth,
	height: desiredHeight,
	left: leftPos,
	top: topPos,
});
