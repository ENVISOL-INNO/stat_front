import "dotenv/config";

export default defineNuxtConfig({
	ssr: false,
	devtools: { enabled: process.env.MODE == "prod" ? false : true },

	build: {
		transpile: ["vuetify"],
	},
	vuetify: {
		vuetifyOptions: {
			theme: {
				themes: {
					test_theme: {
						dark: true,
						colors: {
							primary: "#b71c1c",
						},
					},
					prod_theme: {
						dark: true,
						colors: {
							primary: "#84BC28",
						},
					},
				},
				defaultTheme: process.env.MODE == "prod" ? "prod_theme" : "test_theme",
			},
		},
	},
	vite: {
		optimizeDeps: {
			include: ["plotly.js-dist-min"],
		},
	},
	modules: ["vuetify-nuxt-module", "@pinia/nuxt", "@nuxt/image", "nuxt-plotly"],
	runtimeConfig: {
		// https://nuxt.com/docs/4.x/getting-started/configuration#environment-variables-and-private-tokens
		public: {
			apiBase: "/api",

			backend_url_public: process.env.BACKEND_BASE_URL,
			backend_swag_url_public: process.env.BACKEND_SWAG_BASE_URL,
			backend_green_url_public: process.env.BACKEND_GREEN_BASE_URL,

			mode: process.env.MODE,

			auth0_domain: process.env.AUTH0_DOMAIN,
			auth0_client_id: process.env.AUTH0_CLIENT_ID,
		},
	},

	compatibilityDate: "2024-11-27",
});
