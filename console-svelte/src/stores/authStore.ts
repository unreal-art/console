import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import * as devalue from "devalue";
import type { IAuth } from "@routes/+layout";

const initialState: IAuth = {
	isAuthenticated: false,
};
const createStore = () => {
	const { subscribe, set, update } = persisted("authStore", initialState, {
		serializer: devalue, 
		storage: "session", 
		syncTabs: true, 
		onWriteError: (error) => {
			console.log("🚀 ~ const{subscribe,set,update}=persisted ~ error:", error);
			/* handle or rethrow */
		}, // Defaults to console.error with the error object
		onParseError: (raw, error) => {
			console.log("🚀 ~ const{subscribe,set,update}=persisted ~ error:", error);
			/* handle or rethrow */
		}, // Defaults to console.error with the error object
	});

	function updateAuth(dto: IAuth) {
		update((currentData: IAuth) => {
			currentData = dto;
			return currentData;
		});
	}

	return {
		subscribe,
		reset: () => set({ isAuthenticated: false }),
		updateAuth,
		// deleteProof,
		// addProof,
	};
};

export const AuthStore = createStore();
