export enum StoreMode {
	Extension = "Extension",
	Webpage = "Webpage",
}

function promisifyChromeStorageGet(key: string): Promise<string> {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(key, (result) => {
			if (chrome.runtime.lastError) {
				console.error({ key: chrome.runtime.lastError });
				reject(chrome.runtime.lastError);
			} else {
				resolve(result[key]);
			}
		});
	});
}

export class Store {
	name: string = "";
	storeMode: StoreMode;

	constructor(name: string = "", storeMode: StoreMode = StoreMode.Webpage) {
		this.name = name;
		this.storeMode = storeMode;
	}

	private _getFullKey(key: string): string {
		return `${this.name}_${key}`;
	}

	private _store<T extends string | number>(key: T, value: any): void {
		const fullKey = this._getFullKey(key.toString());
		const storedValue = JSON.stringify(value);

		if (this.storeMode === StoreMode.Extension) {
			chrome.storage.local.set({ [fullKey]: storedValue }, () => {
				if (chrome.runtime.lastError) {
					console.error(`Error setting key ${fullKey}: `, chrome.runtime.lastError);
				}
			});
		} else if (this.storeMode === StoreMode.Webpage) {
			localStorage.setItem(fullKey, storedValue);
		}
	}

	store(key: string, value: any): void {
		this._store(key, value);
	}

	async get<T>(key: string): Promise<T | null> {
		const fullKey = this._getFullKey(key);

		if (this.storeMode === StoreMode.Extension) {
			try {
				const storedValue = await promisifyChromeStorageGet(fullKey);
				return storedValue ? (JSON.parse(storedValue) as T) : null;
			} catch (error) {
				console.error(`Error getting key ${fullKey}: `, error);
				return null;
			}
		} else if (this.storeMode === StoreMode.Webpage) {
			const storedValue = localStorage.getItem(fullKey);
			return storedValue ? (JSON.parse(storedValue) as T) : null;
		} else {
			return null;
		}
	}
}
