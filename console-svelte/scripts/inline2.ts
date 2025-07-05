import inline from "html-inline-external";
import * as fs from "fs";

import { w, staticFolder, buildFolder, indexHtml } from "./constants";

console.log({ indexHtml });
const outHtml = await inline({
	src: indexHtml,
	tags: ["css"],
	minify: true,
	pretty: true,
});

// console.log({outHtml})

fs.writeFileSync(indexHtml, outHtml);

// fs.writeFileSync(indexHtml,outHtml)
console.log("new html file inline2");
