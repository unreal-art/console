import { json, type RequestEvent } from "@sveltejs/kit";
import { UnShortenDeepLink } from "@utils/unshorten.node.js";

export async function POST(event: RequestEvent) {
	// ... endpoint logic

	const req = event.request;

	const { url } = await req.json();

	const decodedUrl = await UnShortenDeepLink(url);

	const res = {
		decodedUrl: decodedUrl.toString(),
	};

	console.log({ res });

	return json(res);
}
