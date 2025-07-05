//@ts-ignore
import { browser, building, dev, version } from "$app/environment";
import type { Proof } from "@reclaimprotocol/js-sdk";

export const prerender = true;

console.log({ browser, building, dev, version });

export interface IProofs {
	id: number | string;
	label: string;
	date: Date;
	providerId: string;
	appId?: string;
	data: Proof;
}
