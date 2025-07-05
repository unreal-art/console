export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16')
];

export const server_loads = [];

export const dictionary = {
		"/": [7],
		"/auth": [8,[2]],
		"/dashboard": [9,[3]],
		"/legal/privacy": [10],
		"/onboarding": [11,[4]],
		"/proof/mint/[proofId]": [12],
		"/proof/verify/[proofId]": [13,[5]],
		"/proof/view/[id]": [14],
		"/qr/[providerId]": [~15],
		"/settings": [16,[6]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
};

export { default as root } from '../root.js';