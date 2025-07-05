"use client";
import bowser from "bowser";

export enum Platform {
	MacOS = "MacOS",
	Windows = "Windows",
	Linux = "Linux",
	Android = "Android",
	iOS = "iOS",
	iPad = "iPad",
}

export const OSS = bowser.OS_MAP;

export function getOperatingSystem(): Platform | undefined {
	const parsedUserAgent = bowser.getParser(window.navigator.userAgent);

	const OS_MAP = bowser.OS_MAP;
	const os = parsedUserAgent.getOS();

	console.debug({ os });
	// console.debug({ OS_MAP });

	const osName = os.name?.toUpperCase();

	switch (os.name) {
		case OS_MAP.MacOS:
			return Platform.MacOS;

		case OS_MAP.Android:
			return Platform.Android;

		// TODO: support
	}

	// if (parsedUserAgent.os.name === 'Android') {
	//   return 'Android;
	// } else if (['iOS', 'iPad', 'iPhone'].includes(parsedUserAgent.os.name)) {
	//   return 'iOS';
	// } else if (parsedUserAgent.os.name === 'Windows') {
	//   return 'Windows';
	// } else if (parsedUserAgent.os.name === 'Macintosh') {
	//   return 'MacOS';
	// } else if (parsedUserAgent.os.name === 'Linux') {
	//   return 'Linux';
	// } else {
	//   return 'Unknown';
	// }
}

// console.log(getOperatingSystem());
