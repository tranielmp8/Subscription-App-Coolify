import adapter from '@sveltejs/adapter-node';

const csrfTrustedOrigins = (process.env.CSRF_TRUSTED_ORIGINS ?? process.env.ORIGIN ?? '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		csrf: {
			trustedOrigins: csrfTrustedOrigins
		},

		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		}
	}
};

export default config;
