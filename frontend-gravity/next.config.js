/** @type {import('next').NextConfig} */
const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
const apiOrigin = apiBase.replace(/\/api$/, '');
const hasAbsoluteApiOrigin = /^https?:\/\//.test(apiOrigin);

let uploadRemotePattern;
if (hasAbsoluteApiOrigin) {
    const parsed = new URL(apiOrigin);
    uploadRemotePattern = {
        protocol: parsed.protocol.replace(':', ''),
        hostname: parsed.hostname,
        pathname: '/uploads/**',
        ...(parsed.port ? { port: parsed.port } : {}),
    };
}

const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        "@gravity-ui/uikit",
        "@gravity-ui/icons",
    ],
    images: {
        remotePatterns: uploadRemotePattern ? [uploadRemotePattern] : [],
    },
    async rewrites() {
        if (!hasAbsoluteApiOrigin) {
            return [];
        }

        return [
            {
                source: "/uploads/:path*",
                destination: `${apiOrigin}/uploads/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
