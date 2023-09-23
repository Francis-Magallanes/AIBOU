/** @type {import('next').NextConfig} */

const nextConfig = {
	reactStrictMode: false,
	experimental: {
		appDir: true,
		esmExternals: "loose", // required
	},
	webpack: (config) => {
		config.externals = [...config.externals, { canvas: "canvas" }]; // required
		return config;
	},
};

module.exports = nextConfig;
