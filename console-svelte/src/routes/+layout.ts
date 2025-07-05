import { browser, building, dev, version } from "$app/environment";

export const prerender = true;

console.log({ browser, building, dev, version });

export interface IAuth {
	isAuthenticated: boolean;
}
