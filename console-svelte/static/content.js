chrome.runtime.sendMessage({ message: "Hello from the content script!" });

// You can also add a listener to receive messages from the background script
chrome.runtime.onMessage.addListener((message) => {
	if (message.greeting) {
		console.log(message.greeting); // This will log a message sent from background script
	}
});
