// export type  Platform =  string

// const MACOS :Platform = "MacOS"

import { Platform } from "./getBrowser";

export function DeepLink<P extends Platform>(platform: P, params: string): URL {
	switch (platform) {
		case Platform.MacOS:
			// u.protocol= ""
			// u.hostname = "reclaimprotocol"
			// u.port=""
			// u.href=""
			// u.origin=""
			return new URL(`reclaimprotocol://${params}`);
	}

	return new URL(`reclaimprotocol://${params}`);
}
