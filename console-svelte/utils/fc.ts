export function addOptions(req: Request): Response | undefined {
	if (req.method === "OPTIONS") {
		const res = new Response("its options");

		res.headers.set("Access-Control-Allow-Origin", "*");
		res.headers.append("Access-Control-Allow-Headers", "*");
		res.headers.append("Access-Control-Allow-Methods", "*");

		return res;
	}
}

export function allowAllOrigin(res: Response) {
	res.headers.set("Access-Control-Allow-Origin", "*");
	res.headers.append("Access-Control-Allow-Headers", "*");
	res.headers.append("Access-Control-Allow-Methods", "*");
}

export function isOption(req: Request, res: Response): boolean {
	if (!res) {
		// res = new Response();
		throw new Error("response is not valid");
	}
	if (req.method === "OPTIONS") {
		allowAllOrigin(res);
		console.log("its options!");
		return true;
	}
	return false;
}
