
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const LDFLAGS: string;
	export const STARSHIP_SHELL: string;
	export const MANPATH: string;
	export const TERM_PROGRAM: string;
	export const DEEPSEEK_API_KEY: string;
	export const NODE: string;
	export const INIT_CWD: string;
	export const ANDROID_HOME: string;
	export const SHELL: string;
	export const TERM: string;
	export const HISTSIZE: string;
	export const TMPDIR: string;
	export const HOMEBREW_REPOSITORY: string;
	export const CPPFLAGS: string;
	export const CAPACITOR_ANDROID_STUDIO_PATH: string;
	export const WEB3_PRIVATE_KEY: string;
	export const BACALHAU_API_HOST: string;
	export const TERM_PROGRAM_VERSION: string;
	export const COIN_ADDRESS: string;
	export const NODE_OPTIONS: string;
	export const WINDOWID: string;
	export const ZDOTDIR: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const MallocNanoZone: string;
	export const npm_config_local_prefix: string;
	export const PNPM_HOME: string;
	export const RUST_BACKTRACE: string;
	export const WASMTIME_HOME: string;
	export const ADMIN_PRIVATE_KEY: string;
	export const USER: string;
	export const NVM_DIR: string;
	export const COMMAND_MODE: string;
	export const COSMOS_PRIVATE_KEY: string;
	export const SSH_AUTH_SOCK: string;
	export const VSCODE_PROFILE_INITIALIZED: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const BUN_WHICH_IGNORE_CWD: string;
	export const PATH: string;
	export const npm_package_json: string;
	export const _: string;
	export const VSCODE_INSPECTOR_OPTIONS: string;
	export const LaunchInstanceID: string;
	export const USER_ZDOTDIR: string;
	export const __CFBundleIdentifier: string;
	export const PWD: string;
	export const KITTY_PID: string;
	export const npm_package_name: string;
	export const LANG: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const XPC_FLAGS: string;
	export const PRIVATE_KEY: string;
	export const RBENV_SHELL: string;
	export const npm_package_version: string;
	export const XPC_SERVICE_NAME: string;
	export const VSCODE_INJECTION: string;
	export const GPG_TTY: string;
	export const GEMINI_API_KEY: string;
	export const HOME: string;
	export const SHLVL: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const TERMINFO: string;
	export const HOMEBREW_PREFIX: string;
	export const STARSHIP_SESSION_KEY: string;
	export const LOGNAME: string;
	export const VISUAL: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const PKG_CONFIG_PATH: string;
	export const npm_config_user_agent: string;
	export const KITTY_WINDOW_ID: string;
	export const KITTY_INSTALLATION_DIR: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const GIT_ASKPASS: string;
	export const HOMEBREW_CELLAR: string;
	export const INFOPATH: string;
	export const DEBUG: string;
	export const SECURITYSESSIONID: string;
	export const npm_node_execpath: string;
	export const COLORTERM: string;
	export const KITTY_PUBLIC_KEY: string;
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_FC_HOST: string;
	export const PUBLIC_DEV_SHOW_MAC: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		LDFLAGS: string;
		STARSHIP_SHELL: string;
		MANPATH: string;
		TERM_PROGRAM: string;
		DEEPSEEK_API_KEY: string;
		NODE: string;
		INIT_CWD: string;
		ANDROID_HOME: string;
		SHELL: string;
		TERM: string;
		HISTSIZE: string;
		TMPDIR: string;
		HOMEBREW_REPOSITORY: string;
		CPPFLAGS: string;
		CAPACITOR_ANDROID_STUDIO_PATH: string;
		WEB3_PRIVATE_KEY: string;
		BACALHAU_API_HOST: string;
		TERM_PROGRAM_VERSION: string;
		COIN_ADDRESS: string;
		NODE_OPTIONS: string;
		WINDOWID: string;
		ZDOTDIR: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		MallocNanoZone: string;
		npm_config_local_prefix: string;
		PNPM_HOME: string;
		RUST_BACKTRACE: string;
		WASMTIME_HOME: string;
		ADMIN_PRIVATE_KEY: string;
		USER: string;
		NVM_DIR: string;
		COMMAND_MODE: string;
		COSMOS_PRIVATE_KEY: string;
		SSH_AUTH_SOCK: string;
		VSCODE_PROFILE_INITIALIZED: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		BUN_WHICH_IGNORE_CWD: string;
		PATH: string;
		npm_package_json: string;
		_: string;
		VSCODE_INSPECTOR_OPTIONS: string;
		LaunchInstanceID: string;
		USER_ZDOTDIR: string;
		__CFBundleIdentifier: string;
		PWD: string;
		KITTY_PID: string;
		npm_package_name: string;
		LANG: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		XPC_FLAGS: string;
		PRIVATE_KEY: string;
		RBENV_SHELL: string;
		npm_package_version: string;
		XPC_SERVICE_NAME: string;
		VSCODE_INJECTION: string;
		GPG_TTY: string;
		GEMINI_API_KEY: string;
		HOME: string;
		SHLVL: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		TERMINFO: string;
		HOMEBREW_PREFIX: string;
		STARSHIP_SESSION_KEY: string;
		LOGNAME: string;
		VISUAL: string;
		VSCODE_GIT_IPC_HANDLE: string;
		PKG_CONFIG_PATH: string;
		npm_config_user_agent: string;
		KITTY_WINDOW_ID: string;
		KITTY_INSTALLATION_DIR: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		GIT_ASKPASS: string;
		HOMEBREW_CELLAR: string;
		INFOPATH: string;
		DEBUG: string;
		SECURITYSESSIONID: string;
		npm_node_execpath: string;
		COLORTERM: string;
		KITTY_PUBLIC_KEY: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_FC_HOST: string;
		PUBLIC_DEV_SHOW_MAC: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
