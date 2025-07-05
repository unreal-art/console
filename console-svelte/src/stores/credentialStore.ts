import { get, writable } from "svelte/store";
import localforage from "localforage";

export interface ICredentials {
	public_key?: string;
	private_key?: string;
	seed_phrase?: string;
	loading: boolean;
	password: string;
	onboarding_time: Date | null;
}

const presistentStore = (
	storeKey,
	initVal,
	{ driver = "INDEXEDDB", storeName = "default-store", dbName = "svelte-presistent-db" } = {},
) => {
	// console.log(storeKey, initVal, driver, storeName, dbName);
	const store = writable(initVal);

	//create persistent store
	let db = localforage.createInstance({
		name: dbName,
		storeName,
		driver: localforage[driver],
	});

	//check if driver is OK
	db.ready()
		.then(function () {
			readValueToStore();
		})
		.catch(function (e) {
			store.set(undefined);
		});

	let storeReady = false;

	//read value in persistent stores
	function readValueToStore() {
		db.getItem(storeKey).then((value: ICredentials | any) => {
			if (value === null) {
				value = initVal;
			}
			storeReady = true;
			value.loading = false;
			store.set(value);
		});
	}

	//return custom store
	return {
		subscribe: store.subscribe,
		update: (value) => {
			store.update(value);

			if (storeReady) {
				db.setItem(storeKey, get(store));
			}
		},
		set: (value) => {
			store.set(value);
			if (storeReady) {
				db.setItem(storeKey, value);
			}
		},
	};
};

const initialCredentials: ICredentials = {
	public_key: "",
	private_key: "",
	seed_phrase: "",
	password: "",
	loading: true,
	onboarding_time: null,
};

export let CredentialStore = presistentStore("credentials", initialCredentials, {
	dbName: "credential-db",
	driver: "INDEXEDDB",
});

export default CredentialStore;
