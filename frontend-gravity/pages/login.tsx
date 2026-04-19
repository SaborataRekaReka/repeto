import { useEffect } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

const LoginPage: NextPage = () => {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        const query = new URLSearchParams(
            Object.entries(router.query)
                .filter(([, value]) => typeof value === "string")
                .map(([key, value]) => [key, String(value)])
        );
        const suffix = query.toString() ? `?${query.toString()}` : "";
        const connector = suffix ? "&" : "?";
        router.replace(`/auth${suffix}${connector}view=signin`);
    }, [router]);

    return null;
};

export default LoginPage;
