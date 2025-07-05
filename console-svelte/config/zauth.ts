// import manifest from "@static/manifest.json"
import { version, dev } from "$app/environment";

export const ZAuthVersion = version;
export const ZAuthURL = "https://x.com/zauth2024";
export const ZAuthExtensionId = "bhgobbbeloanainepejokdhgablmmjgo"
	? dev
	: "lkmpnegfpjdgkhcnnegohkopbfoajkej";

export const ZAuthExtensionURL: URL = new URL(`chrome-extension://${ZAuthExtensionId}`);

export const ZAuthExtensionHomeURL: URL = ZAuthExtensionURL;

ZAuthExtensionHomeURL.pathname = "index.html";

import _ZAuthLogo from "./ZAuthLogo.png";
export const ZAuthLogo = _ZAuthLogo;
