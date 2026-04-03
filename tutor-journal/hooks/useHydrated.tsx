import { useState, useEffect } from "react";

export const useHydrated = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return { mounted };
};
