import { derived } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import * as devalue from "devalue";
import type { Proof } from "@reclaimprotocol/js-sdk";

export interface IProofs {
	id: number | string;
	label: string;
	date: Date;
	providerId: string;
	appId?: string;
	data: Proof;
}

const createProofStore = () => {
	const { subscribe, set, update } = persisted("persProofStore", new Array<IProofs>(), {
		serializer: devalue, // defaults to `JSON`
		storage: "local", // 'session' for sessionStorage, defaults to 'local'
		syncTabs: true, // choose whether to sync localStorage across tabs, default is true
		onWriteError: (error) => {
			console.error("🚀 ~ const{subscribe,set,update}=persisted ~ error:", error);
			/* handle or rethrow */
		}, // Defaults to console.error with the error object
		onParseError: (raw, error) => {
			console.error("🚀 ~ const{subscribe,set,update}=persisted ~ error:", error);
			/* handle or rethrow */
		}, // Defaults to console.error with the error object
	});

	function updateProof(id: string | number, dto: IProofs) {
		update((currentData: IProofs[]) => {
			let dataToUpdate = currentData.find((data) => data.id === id);
			if (dataToUpdate) {
				// Update properties of the found label
				dataToUpdate = dto;
			}
			// localStorage.setItem("proofs", JSON.stringify(currentData));

			return currentData;
		});
	}

	function addProof(data: IProofs) {
		update((currentData: IProofs[]) => {
			// localStorage.setItem("proofs", JSON.stringify(updatedState));

			const proofData: Proof = data.data;
			// TODO: validate proofData
			const updatedState = (currentData = [...currentData, data]);

			return updatedState;
		});
	}

	function deleteProof(id: string | number) {
		update((currentData: IProofs[]) => {
			const updatedState = currentData.filter((proof) => proof.id != id);
			// localStorage.setItem("proofs", JSON.stringify(updatedState));

			return updatedState;
		});
	}

	function size(providerId: string): number {
		let count: number = 0;
		subscribe((currentData: IProofs[]) => {
			count = currentData.filter((proof) => proof.providerId === providerId).length;
		})();
		return count;
	}

	return {
		subscribe,
		reset: () => set([]),
		updateProof,
		deleteProof,
		addProof,
		size,
	};
};

export const ProofStore = createProofStore();

export const latestProof = derived(ProofStore, ($proofStore) => {
	if ($proofStore.length === 0) return null;
	return $proofStore[$proofStore.length - 1];
});

// export const ProofStoreId = derived(ProofStore, ($proofStore) => {
// 	return $proofStore.length + 1;
// });
