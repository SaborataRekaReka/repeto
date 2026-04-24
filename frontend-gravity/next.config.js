/** @type {import('next').NextConfig} */
const withBundleAnalyzer = process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true })
    : (cfg) => cfg;

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
            // In dev mode with relative /api, uploads still need proxying to backend
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:3200';
            return [
                {
                    source: "/uploads/:path*",
                    destination: `${backendUrl}/uploads/:path*`,
                },
            ];
        }

        return [
            {
                source: "/uploads/:path*",
                destination: `${apiOrigin}/uploads/:path*`,
            },
        ];
    },
};

module.exports = withBundleAnalyzer(nextConfig);
