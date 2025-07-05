import * as fs from "fs";
import path from "path";

export const w = path.dirname(__dirname);
export const staticFolder = path.join(w, "static");
export const scriptsFolder = path.join(w, "scripts");
console.log({ staticFolder });

export const buildFolder = path.join(staticFolder, "build");

console.log({ buildFolder });
