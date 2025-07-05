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
