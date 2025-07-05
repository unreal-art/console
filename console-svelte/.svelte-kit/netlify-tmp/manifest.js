export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "app",
	appPath: "app",
	assets: new Set([".DS_Store","android-chrome-192x192.png","android-chrome-512x512.png","apple-touch-icon.png","background.ts","browserconfig.xml","favicon-16x16.png","favicon-32x32.png","favicon.ico","manifest.json","mstile-150x150.png","safari-pinned-tab.svg","site.webmanifest"]),
	mimeTypes: {".png":"image/png",".ts":"video/mp2t",".xml":"application/xml",".json":"application/json",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"},
	_: {
		client: {"start":"app/immutable/entry/start.2010af9d.js","app":"app/immutable/entry/app.d0fc55dc.js","imports":["app/immutable/entry/start.2010af9d.js","app/immutable/chunks/index-client.e9891b08.js","app/immutable/chunks/runtime.ffe6401e.js","app/immutable/chunks/singletons.77f6015a.js","app/immutable/chunks/index.f1d50af0.js","app/immutable/entry/app.d0fc55dc.js","app/immutable/chunks/proxy.bce3af1c.js","app/immutable/chunks/runtime.ffe6401e.js","app/immutable/chunks/disclose-version.24bb45ca.js","app/immutable/chunks/props.73fefd26.js","app/immutable/chunks/svelte-component.93ba620c.js","app/immutable/chunks/index-client.e9891b08.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js'))
		],
		routes: [
			{
				id: "/proof/view/[id]",
				pattern: /^\/proof\/view\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/qr/[providerId]",
				pattern: /^\/qr\/([^/]+?)\/?$/,
				params: [{"name":"providerId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: __memo(() => import('../output/server/entries/endpoints/qr/_providerId_/_server.ts.js'))
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();

export const prerendered = new Set(["/"]);
