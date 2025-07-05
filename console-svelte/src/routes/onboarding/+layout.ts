import type { Proof } from "@reclaimprotocol/js-sdk";

export const prerender = true;

export interface IProofs {
	id: number | string;
	label: string;
	date: Date;
	providerId: string;
	appId?: string;
	data: Proof;
}

export interface IWallet {
	publicAddress: string;
	privateAddress: string;
	mnemonic: string;
}
