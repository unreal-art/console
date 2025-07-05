const myHeaders = new Headers();
// myHeaders.append("Cookie", "_s=INXJDFyG3ygCBtjArrjH56xvepZJxyYjCry2HkdwV8WAuTfu0sozciXLLhvhM5Sj");

const requestOptions = {
	method: "GET",
	headers: myHeaders,
	redirect: "follow",
};

fetch("https://i302z.app.link/nYLJ1l7pBJb")
	.then((response) => response.text())
	.then((result) => {
		// console.log(result)
		let pattern = /href="([^"]+)"\s*>/;
		pattern = /href="(https:\/\/[^"]+)"\s*>/;
		pattern = /href="(https:\/\/apps.apple.com\/vg\/app\/reclaim-protocol\/[^"]+)"\s*>/;

		const matches = result.match(pattern);
		console.log(matches);
		// if (!matches) {
		// 	throw new Error("no match")
		// }

		const urlRegex =
			/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
		// @ts-ignore
		const myUrl = matches[0].match(urlRegex)[0];
		console.log({ myUrl });
	})
	.catch((error) => console.error(error));
