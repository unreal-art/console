import type { PageLoad } from "./$types.js";

async function UnShorten(url: string): Promise<URL> {
	const res = await fetch(url, {
		mode: "cors",
		redirect: "manual",
	});

	const result = await res.text();

	console.log({ result });

	let pattern = /href="([^"]+)"\s*>/;
	pattern = /href="(https:\/\/[^"]+)"\s*>/;

	// FIXME:
	pattern = /href="(https:\/\/apps.apple.com\/vg\/app\/reclaim-protocol\/[^"]+)"\s*>/;

	const matches = result.match(pattern) || [];

	console.log({ matches });

	const urlRegex =
		/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

	//@ts-ignore
	const myUrl = matches[0].match(urlRegex)[0];

	console.log({ myUrl });

	return new URL(myUrl);
}

// const load : PageLoad = async({  fetch, params })=> {
//   let u = "https://i302z.app.link/nYLJ1l7pBJb"
// 	const decodedURL = await UnShorten(u);

// 	console.log("onLoad", decodedURL)

// 	return {
// 		 decodedURL:decodedURL,
//   }
// }
