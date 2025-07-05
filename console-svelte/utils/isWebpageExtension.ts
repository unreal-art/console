import bowser from "bowser";

export function checkEnvironment() {
	if (isExtension()) {
		console.log("This is a browser extension.");
	} else if (isWebpage()) {
		console.log("This is a webpage.");
	} else {
		console.log("Unknown environment.");
	}
}

export function isExtension() {
	return (
		(typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined") ||
		//  (typeof browser !== 'undefined' && typeof browser?.runtime !== 'undefined') ||
		window.location.protocol === "chrome-extension:" ||
		window.location.protocol === "moz-extension:" ||
		window.location.protocol === "safari-extension:"
	);
}

export function isWebpage() {
	return window.location.protocol === "http:" || window.location.protocol === "https:";
}

// pageUrl: $page.url
export function isWebpage2(url: URL): boolean {
	let flag: boolean = url.protocol in ["http", "https"];

	return flag;
}

// Call the function to check the environment
// checkEnvironment();
