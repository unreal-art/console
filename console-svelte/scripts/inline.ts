import * as fs from "fs";
import path from "path";

import { chdir, cwd } from "node:process";

const w = path.dirname(__dirname);
const staticFolder = path.join(w, "static");
console.log({ staticFolder });

const buildFolder = path.join(staticFolder, "build");

console.log({ buildFolder });

let htmlContent = "";

//@ts-ignore
import indexHTML from "../build/index.html";

htmlContent = fs.readFileSync(indexHTML, "utf8");

// import {inlineScriptTags} from 'inline-scripts'

// chdir(buildFolder);

// await $`pwd`.cwd(buildFolder); // /tmp
// console.log('New directory:', cwd());

import { inlineSource } from "inline-source";

// export function handler(source, context) {
//   if (source.fileContent && !source.content && source.type == 'js') {
//     // source.content = "Hey! I'm overriding the file's content!";
//     console.log(source.type)
//   }
// }
function prehandler(source, context) {
	console.log(source.type);
	source.content = "Hi there";
	// source.content = "Hey! I'm overriding the file's content!";
}
// inlineScriptTags(indexHTML)

try {
	const html = await inlineSource(indexHTML, {
		compress: true,
		// attribute: "inlineScript",
		// pretty:true,
		rootpath: path.resolve(buildFolder),
		saveRemote: true,
		// Skip all css types and png formats
		ignore: ["png"],
		preHandlers: [
			// handler,
			prehandler,
		],
		swallowErrors: false,
	});
	// console.log(html)j

	fs.writeFileSync(indexHTML, html);

	console.log("inline html");
} catch (err) {
	// Handle error
	console.error(err);
	process.exit(1);
}
