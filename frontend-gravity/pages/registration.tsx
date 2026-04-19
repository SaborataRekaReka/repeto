import type { NextPage } from "next";
import { useEffect } from "react";
import { useRouter } from "next/router";

const Registration: NextPage = () => {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        const query = new URLSearchParams(
            Object.entries(router.query)
                .filter(([, value]) => typeof value === "string")
                .map(([key, value]) => [key, String(value)])
        );
        const suffix = query.toString() ? `?${query.toString()}` : "";
        router.replace(`/auth${suffix}`);
    }, [router]);

    return null;
};

export default Registration;
