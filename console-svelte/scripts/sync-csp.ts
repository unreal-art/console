import * as fs from "fs";
import * as cheerio from "cheerio";
import path from "path";
// console.log({__dirname})

const staticFolder = path.join(path.dirname(__dirname), "static");
console.log({ staticFolder });

const manifestPath = path.join(staticFolder, "manifest.json");

let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="content-security-policy" content="default-src 'unsafe-inline' 'self'; connect-src 'self' data: https: filesystem: http:; font-src 'self' 'unsafe-inline' data:; script-src 'self' 'wasm-unsafe-eval' 'sha256-i9E28mrlXXNyHGieiI4plmtOhlj5yzx577RcolKyKr4='; script-src-elem 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'">
    <title>Document</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
`;

//@ts-ignore
import indexHTML from "../build/index.html";

htmlContent = fs.readFileSync(indexHTML, "utf8");

// console.log({htmlContent})

// process.exit(1)

interface CSPDirectives {
	[key: string]: string[];
}

function parseCSP(html: string): CSPDirectives | null {
	const $ = cheerio.load(html);
	const metaTag = $('meta[http-equiv="content-security-policy"]');
	if (metaTag.length === 0) {
		return null;
	}

	const cspContent = metaTag.attr("content");
	if (!cspContent) {
		return null;
	}

	const cspDict: CSPDirectives = {};
	const directives = cspContent.split(";");
	for (const directive of directives) {
		const parts = directive.trim().split(/\s+/);
		if (parts.length > 0) {
			const directiveName = parts[0];
			const directiveValues = parts.slice(1);
			cspDict[directiveName] = directiveValues;
		}
	}

	return cspDict;
}

// Parsing the CSP from the sample HTML content
const cspDict = parseCSP(htmlContent);
let cspString = "";

const ignoredDirectives = ["style-src"];

// Output the parsed CSP directives
if (cspDict) {
	for (const [directive, values] of Object.entries(cspDict)) {
		let cspValues = values.join(" ");
		console.log(`${directive}: ${cspValues}`);
		if (["script-src", "style-src"].includes(directive)) {
			cspValues = values.filter((value) => value.startsWith("sha")).join(" ");
			console.log("ignoring sha for", directive);
		}

		if (ignoredDirectives.includes(directive)) {
			continue;
		}

		// cspValues = values.filter(value => value.trim().startsWith("sha")).join(' ');

		cspString = `${cspString}${directive} ${cspValues};`;
	}
} else {
	console.log("No CSP meta tag found");
}

console.log({ cspDict });
console.log({ cspString });

import manifest from "../static/manifest.json";

// const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// console.log(manifestData);
console.log(manifest);

manifest["content_security_policy"]["extension_pages"] = cspString;

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(manifestPath, "written");
