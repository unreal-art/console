import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

import path from "path";

export default defineConfig({
	server: {
		fs: {
			// Allow serving files from one level up to the project root
			allow: [".."],
		},
	},
	plugins: [sveltekit()],
	resolve: {
		alias: {
			"@": path.resolve("./"),
			"@static": path.resolve("./static"),
			"@src": path.resolve("./src"),
			"@routes": path.resolve("./src/routes"),
			$routes: path.resolve("./src/routes"),
			$lib: path.resolve("./src/lib"),
			$stores: path.resolve("./src/stores"),
			"@stores": path.resolve("./src/stores"),
			$utils: path.resolve("./utils"),
			"@utils": path.resolve("./utils"),
			"@config": path.resolve("./config"),
			"@components": path.resolve("./src/lib/components"),
			$components: path.resolve("./src/lib/components"),
		},
	},

	build: {
		//FIXME: overriden
		outDir: path.join(__dirname, "build"),
	},
});
