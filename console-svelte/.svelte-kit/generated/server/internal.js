
import root from '../root.js';
import { set_building } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"default-src":["self","unsafe-inline","data:"],"connect-src":["self","data:","https:","filesystem:","http:","wss:"],"font-src":["self","unsafe-inline","data:"],"script-src":["self","wasm-unsafe-eval","unsafe-inline","unsafe-hashes"],"script-src-elem":["self","unsafe-inline","wasm-unsafe-eval"],"style-src":["self","unsafe-inline"],"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: false,
	track_server_fetches: false,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"" + assets + "/favicon.ico\" />\n\n\t\t<!-- favicon -->\n\t\t<link rel=\"manifest\" href=\"" + assets + "/site.webmanifest\" />\n\t\t<link rel=\"mask-icon\" href=\"" + assets + "/safari-pinned-tab.svg\" color=\"#5bbad5\" />\n\t\t<meta name=\"apple-mobile-web-app-title\" content=\"ZAuth\" />\n\t\t<meta name=\"application-name\" content=\"ZAuth\" />\n\t\t<meta name=\"msapplication-TileColor\" content=\"#da532c\" />\n\t\t<meta name=\"theme-color\" content=\"#ffffff\" />\n\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"57x57\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-57x57.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"60x60\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-60x60.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"72x72\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-72x72.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"76x76\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-76x76.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"114x114\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-114x114.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"120x120\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-120x120.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"144x144\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-144x144.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"152x152\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-152x152.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"apple-touch-icon\"\n\t\t\tsizes=\"180x180\"\n\t\t\thref=\"" + assets + "/favicons/apple-icon-180x180.png\"\n\t\t/>\n\n\t\t<link\n\t\t\trel=\"icon\"\n\t\t\ttype=\"image/png\"\n\t\t\tsizes=\"192x192\"\n\t\t\thref=\"" + assets + "/favicons/android-icon-192x192.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"icon\"\n\t\t\ttype=\"image/png\"\n\t\t\tsizes=\"32x32\"\n\t\t\thref=\"" + assets + "/favicons/favicon-32x32.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"icon\"\n\t\t\ttype=\"image/png\"\n\t\t\tsizes=\"96x96\"\n\t\t\thref=\"" + assets + "/favicons/favicon-96x96.png\"\n\t\t/>\n\t\t<link\n\t\t\trel=\"icon\"\n\t\t\ttype=\"image/png\"\n\t\t\tsizes=\"16x16\"\n\t\t\thref=\"" + assets + "/favicons/favicon-16x16.png\"\n\t\t/>\n\n\t\t<meta name=\"msapplication-TileImage\" content=\"/ms-icon-144x144.png\" />\n\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\n\t\t" + head + "\n\t</head>\n\n\t<body data-sveltekit-preload-data=\"hover\">\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t</body>\n</html>\n",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "slx560"
};

export function get_hooks() {
	return import("../../../src/hooks.server.js");
}

export { set_assets, set_building, set_private_env, set_public_env };
