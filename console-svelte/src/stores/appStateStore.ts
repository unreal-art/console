import { derived, writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import * as devalue from "devalue";

import { type IProvider, _DEFAULT_APPLICATION, _DEFAULT_APP_PROVIDER } from "../../config";

export class AppState {
	curApp: string = _DEFAULT_APPLICATION;
	curAppProvider: IProvider = _DEFAULT_APP_PROVIDER(_DEFAULT_APPLICATION);

	// constructor() {
	// 	this.curApp = _DEFAULT_APPLICATION;
	// }
}

/** update this when there is breaking change like keys or to invalidate proofs on localStorage during app upgrades */
const appStateVersion = "v1";

const createStore = () => {
	const { subscribe, set, update } = persisted("appState" + appStateVersion, new AppState(), {
		serializer: JSON, // defaults to `JSON`
		storage: "local", // 'session' for sessionStorage, defaults to 'local'
		syncTabs: true, // choose whether to sync localStorage across tabs, default is true
		onWriteError: (error) => {
			console.error("🚀 ~ write error:", error);
			/* handle or rethrow */
		}, // Defaults to console.error with the error object
		onParseError: (raw, error) => {
			console.error("🚀 ~ parse error:", error);
			/* handle or rethrow */
		}, // Defaults to console.error with the error object
	});

	function setCurApp(app: string) {
		console.log("set CurApp", app);
		update((appConfig: AppState) => {
			appConfig.curApp = app;
			return appConfig;
		});
	}

	function setCurAppProvider(appProvider: IProvider) {
		console.log("set CurAppProvider", appProvider);
		update((appConfig: AppState) => {
			appConfig.curAppProvider = appProvider;
			return appConfig;
		});
	}

	function update_(key: string, value: any) {
		console.log("update appConfig", key, value);
		update((appConfig: AppState) => {
			appConfig[key] = value;
			return appConfig;
		});
	}

	return {
		subscribe,
		setCurApp,
		setCurAppProvider,
		update_,
		reset: () => new AppState(),
	};
};

export const AppStateStore = createStore();
