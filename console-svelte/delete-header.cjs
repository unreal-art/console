const fs = require("fs");
const path = require("path");

// Specify the directory where your Svelte build output is located
const buildDir = path.resolve(__dirname, "./build");

// Function to delete the _header file
function deleteHeaderFile() {
	const headerFilePath = path.join(buildDir, "_headers");

	// Check if the file exists
	if (fs.existsSync(headerFilePath)) {
		// Delete the file
		fs.unlinkSync(headerFilePath);
		console.log("_header file deleted successfully.");
	} else {
		console.log("_header file not found.");
	}
}

// Call the function to delete the file
deleteHeaderFile();
