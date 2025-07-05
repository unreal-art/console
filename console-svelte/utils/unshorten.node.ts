let u_ = "https://i302z.app.link/nYLJ1l7pBJb";

export async function UnShortenDeepLink(url: string): Promise<URL> {
	const res = await fetch(url, {
		mode: "cors",
		redirect: "follow",
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

	return new URL(`https://${myUrl}`);
}

export type ResPathQuery = {
	pathname?: string;
	searchQuery?: string;
};

export function retreivePathQuery(u: URL): ResPathQuery {
	return {
		pathname: u.pathname.split("/")?.at(-1),
		searchQuery: u.search,
	};
}

// export async function UnShorten(url:string):Promise<URL>{
//   const u = await unshorten(url);
//   console.log({u})
//   // await swUnshorten(url)
//   return u
// }

// (async()=>{
//   await UnShortenDeepLink(u_)
//   console.log("complete")
// })()
