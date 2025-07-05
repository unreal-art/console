export const prerender = false;
export const ssr = true;

// export const load = ({ params }) => {
// 	return {}
// };
import { PUBLIC_FC_HOST } from "$env/static/public";

export async function load() {
	return {
		PUBLIC_FC_HOST,
	};
}
