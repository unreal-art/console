import KaggleLogo from "./logos/kaggle.svg";
import TwitterLogo from "./logos/twitter.svg";
import XLogo from "./logos/x.svg";
import HuggingFaceLogo from "./logos/huggingface.svg";

export enum App {
	kaggle,
	twitter,
	huggingface,
	linkedin,
	github,
	gitlab,
	google,
}

// apps
const kaggle = "kaggle";
const twitter = "twitter";
const X = "X";
const huggingface = "huggingface";

type IApp = {
	name: string;
	label: string;
	logo: string;
	logo2?: string;

	url: string;
	desc: string;
};

import KaggleLogo2 from "./logos/kaggle2.svg";
import HuggingFaceLogo2 from "./logos/huggingface2.svg";
import GithubLogo from "./logos/github.svg";
import GithubLogo2 from "./logos/github2.svg";
import SwiggyLogo from "./logos/swiggy.svg";
import SwiggyLogo2 from "./logos/swiggy2.svg";
import HackerRankLogo from "./logos/hackerrank.svg";
import LinkedInLogo from "./logos/linkedin.svg";
import LinkedInLogo2 from "./logos/linkedin2.svg";

/*Defaults*/
export const _applicationList: Array<IApp> = [
	{
		name: kaggle, //FIXME: its redirecting to X follower count
		label: "Kaggle",
		logo: KaggleLogo,
		url: "http://kaggle.com",
		desc: "A data science and artificial intelligence platform.",
		logo2: KaggleLogo2,
	},
	// {
	// 	name: twitter,
	// 	label: "Twitter",
	// 	logo: TwitterLogo,
	// 	url: "http://twitter.com",
	// 	desc: "Social media platform for short messages, news, and real-time updates",
	// 	logo2: XLogo,
	// },
	{
		name: huggingface,
		label: "Hugging Face",
		logo: HuggingFaceLogo,
		url: "http://huggingface.co",
		desc: "GitHub of machine learning because it lets developers share and test their work openly",
		logo2: HuggingFaceLogo2,
	},
	{
		name: X,
		label: "X/Twitter",
		logo: XLogo,
		url: "http://x.com",
		desc: "Social media platform for short messages, news, and real-time updates",
		logo2: TwitterLogo,
	},
	{
		name: "linkedin",
		label: "LinkedIn",
		logo: LinkedInLogo,
		url: "https://linkedin.com",
		desc: "Professional networking platform for job searching and business connections",
		logo2: LinkedInLogo2,
	},
	{
		name: "github",
		label: "Github",
		logo: GithubLogo,
		url: "https://github.com",
		desc: "Platform for version control, code collaboration, and repository management",
		logo2: GithubLogo2,
	},
	{
		name: "swiggy",
		label: "Swiggy",
		logo: SwiggyLogo,
		url: "https://swiggy.com",
		desc: "Online food delivery service connecting users with local restaurants in India",
		logo2: SwiggyLogo2,
	},
	{
		name: "hackerrank",
		label: "HackerRank",
		logo: HackerRankLogo,
		url: "https://hackerrank.com",
		desc: "Platform for coding challenges, competitions, and technical skill assessments.",
	},
];
export type IProvider = {
	name: string; //providerName
	id: string;
};
export type IAppProviders = {
	[key: string]: Array<IProvider>;
};
export const _AppProviderList: IAppProviders = {
	kaggle: [
		//use App.kaggle
		{
			name: "Username",
			// id: "c94476a0-8a75-4563-b70a-bf6124d7c59b",
			id: "6d3122ab-0cbf-4cd1-8ddf-dced120d0e8b",
		},
	],
	huggingface: [
		{
			name: "Username",
			id: "aaa47198-2523-40da-b9a9-bfa290730d52",
		},
	],
	X: [
		{ name: "Username", id: "9c31ffd-0be0-4e45-9a18-1eb3cb8099d4" }, //DSID Solana
		// {
		// 	name: "Follower Count",
		// 	id: "6d3122ab-0cbf-4cd1-8ddf-dced120d0e8b",
		// },
	],
	swiggy: [
		// {
		// 	name: "Total Orders",
		// 	id: "b78629e0-c589-45ae-b995-a288478effae",
		// },
		// {
		// 	name: "Total Order count",
		// 	id: "1f435c73-1efa-4747-967d-023b5f17a1da",
		// }, //FIXME:
		// {
		// 	name: "Rating of last order",
		// 	id: "453e671a-db73-460a-b4e7-e5471fff1734",
		// },
		{
			name: "Last Order",
			id: "e2428527-b302-412c-a999-5941d7eb306f",
		},
		{
			name: "Last 3 Addresses",
			id: "4800d18c-59c7-48af-94c5-bc53f8c6db6e",
		},
	],
	hackerrank: [
		{
			name: "Email",
			id: "db232bf8-06f3-4ea4-96e1-6f4f33b8dfad",
		},
		{
			name: "Score",
			id: "fb838e67-7dff-4ee0-8b21-da3c46433fd4",
		},
	],
	github: [
		{
			name: "Username",
			id: "eea88931-af56-471f-bbc0-5df8330e52f8",
		},
		// {
		// 	name: "Commits to repo",
		// 	id: "c0b6fb69-a127-47b7-9740-dddbd879d1d7",
		// },
	],
	linkedin: [
		// {
		// 	name: "Username",
		// 	id: "6687ea24-3269-4745-9598-50c6638e130e",
		// },
		// {
		// 	name: "Follower Count",
		// 	id: "76a3585a-30ee-45a2-8c10-56d967a04fe3",
		// },
		{
			name: "Post Impressions",
			id: "6e9cba4f-7ed2-41e6-a9cb-c9a2b6c1fe4f",
		},
	],
	// twitter: ["Username", "Followers"] //"Profile",
	// google: ["Gmail"],
	// linkedin: ["Username", "Profile", "Followers"]
};
export const _DEFAULT_APP = _applicationList[1];
export const _DEFAULT_APPLICATION = _DEFAULT_APP.name;
export const _DEFAULT_APP_PROVIDER = (app: string) => _AppProviderList[app][0];
/*Placeholder ui*/
export const _PLACEHOLDER_SELECT_APPLICATION = "Select The Application";
export const _PLACEHOLDER_SELECT_APP_PROVIDER = "Select The Provider";

export const _WALLET_ADDRESS = "eH9js2vBZGCxb3MmweX9zkJDHp7DmJuZS31tTrQFw8e";
export const _QR_KEY = "qr_link";

export const getApp = (appProviderId: string): IApp => {
	for (const app in _AppProviderList) {
		const providers = _AppProviderList[app];
		const foundProvider = providers.find((provider) => provider.id === appProviderId);
		if (foundProvider) return getAppByName(app);
	}

	throw new Error("404 App Not Found");
};
export const getAppByName = (appName: string): IApp => {
	return _applicationList.find((app) => app.name === appName)!;
};

// console.log("app:", getApp(_AppProviderList.kaggle[0].id));

export function findAppProvider(providerId: string): IProvider {
	// Flatten the _AppProviderList into a single array of providers
	const allProviders = Object.values(_AppProviderList).reduce(
		(acc, providers) => acc.concat(providers),
		[],
	);

	// Find the provider with the given providerId
	const foundProvider = allProviders.find((provider) => provider.id === providerId);

	if (!foundProvider) throw new Error("No such provider: " + providerId);

	return foundProvider;
}
