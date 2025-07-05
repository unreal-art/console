import * as fs from "fs";
import path from "path";

export const w = path.dirname(__dirname);
export const staticFolder = path.join(w, "static");
export const scriptsFolder = path.join(w, "scripts");
console.log({ staticFolder });

export const buildFolder = path.join(staticFolder, "build");

console.log({ buildFolder });

//@ts-ignore
import htmlLoc from "../build/index.html";

console.log({ htmlLoc });

export const indexHtml = htmlLoc;
export const htmlContent = fs.readFileSync(indexHtml, "utf8");
