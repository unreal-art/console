import manifest from "../static/manifest.json";
import { execSync } from "child_process";
import { scriptsFolder, staticFolder, w } from ".";
import fs, { fstatSync } from "fs";
import args from "args";
import { createInterface } from "node:readline/promises";

args.option("tag", "The tag", "").option("message", "The tag message", "");

console.debug(process.argv);

const flags = args.parse(process.argv);

flags.tag ??= flags.t;
flags.message ??= flags.m;

console.log({ flags });

const input = createInterface({
	input: process.stdin,
	output: process.stdout,
});

// console.log(manifest)
import { exec } from "child_process";
import semver from "semver";

function isCurrentBranchMain(): Promise<boolean> {
	return new Promise((resolve, reject) => {
		// Execute the git command to get the current branch name
		exec("git rev-parse --abbrev-ref HEAD", (error, stdout, stderr) => {
			if (error) {
				reject(`Error executing git command: ${stderr}`);
				return;
			}
			// Trim the output to remove any extra whitespace or newlines
			const currentBranch = stdout.trim();
			resolve(currentBranch === "main");
		});
	});
}
const isMain = await isCurrentBranchMain();
console.log({ isMain });

let tag =
	flags.tag ||
	process.env.TAG ||
	execSync("git describe --tags || git rev-parse --short HEAD").toString().trim();

let message = flags.message;

if (flags.tag) {
	if (!message) {
		let tag = flags.tag;
		message = await input.question("What is the tag message? ");
		if (!message) {
			console.error("invalid tag message");
			// message = `release:${tag}`;
			// flags.message = message;
		}
		console.log(`${tag} ^^ ${message}`);
		input.close();
	}
}

// deprecated:
if (!tag) {
	// throw new Error("No tag specified")
	const tagOutput = execSync(`bash ${scriptsFolder}/tag.bash`).toString().trim();
	let match = tagOutput.match(/TAG=(.*)/);

	console.log(`Tag: ${tagOutput}`);

	console.log({ match });
	//@ts-ignore
	tag = match[1].trim();
}

console.log("found tag: " + tag);

const semverVersion = semver.parse(tag);
if (!semverVersion) {
	throw new Error("not semver version");
}

console.log({ semverVersion });

let cleanedTag = tag.replace(/^v(\d+)\.(\d+)\.(\d+)-.*$/, "$1.$2.$3");
if (cleanedTag[0] == "v") {
	cleanedTag = cleanedTag.slice(1);
	console.log("cleaned tag: " + cleanedTag);
}

console.log({ cleanedTag });

const shouldWriteManifest = semverVersion.prerelease.length == 0;

let manifestVersion = `${semverVersion.major}.${semverVersion.minor}.${semverVersion.patch}`;
console.log({ manifestVersion });

if (shouldWriteManifest) {
	manifest.version = manifestVersion;
	console.log(manifest);
	fs.writeFileSync(`${staticFolder}/manifest.json`, JSON.stringify(manifest, null, 2));
	console.log("write manifest.json");
}

const zauth = {
	name: "ZAuth",
	version: tag,
};

// due to manifest.json only supporting numbered version
fs.writeFileSync(`${staticFolder}/zauth.json`, JSON.stringify(zauth, null, 2));

console.log("write zauth.json");

import packageJSON from "@/package.json";

packageJSON.version = semverVersion.version;

if (isMain || flags.tag) {
	fs.writeFileSync(`${w}/package.json`, JSON.stringify(packageJSON, null, 2));
	console.log("wrote package.json");
}

if (flags.tag) {
	let commitMsg = `release ${tag} : ${message}`;
	commitMsg = JSON.stringify(commitMsg);
	message = JSON.stringify(message);
	console.log("message is", message);
	console.log("commitMessage is", commitMsg);
	execSync(`git add -u && git commit -m '${commitMsg}'`);
	execSync(`git tag -a '${tag}' -m '${message}'`);
	console.log("git commit, tagged");
}
