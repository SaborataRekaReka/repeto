/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    devIndicators: false,
    transpilePackages: [
        "@gravity-ui/uikit",
        "@gravity-ui/icons",
    ],
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "3200",
                pathname: "/uploads/**",
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: "/uploads/:path*",
                destination: "http://localhost:3200/uploads/:path*",
            },
        ];
    },
};

module.exports = nextConfig;
