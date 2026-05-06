import { useEffect } from "react";

type ScrollLockState = {
    bodyOverflow: string;
    bodyOverscrollBehavior: string;
    documentOverflow: string;
    documentOverscrollBehavior: string;
};

let activeLocks = 0;
let savedState: ScrollLockState | null = null;

const lockBodyScroll = () => {
    if (typeof document === "undefined") return;

    const body = document.body;
    const documentElement = document.documentElement;

    if (activeLocks === 0) {
        savedState = {
            bodyOverflow: body.style.overflow,
            bodyOverscrollBehavior: body.style.overscrollBehavior,
            documentOverflow: documentElement.style.overflow,
            documentOverscrollBehavior: documentElement.style.overscrollBehavior,
        };

        body.style.overflow = "hidden";
        body.style.overscrollBehavior = "none";
        documentElement.style.overflow = "hidden";
        documentElement.style.overscrollBehavior = "none";
        body.classList.add("repeto-lp2-scroll-locked");
        documentElement.classList.add("repeto-lp2-scroll-locked");
    }

    activeLocks += 1;
};

const unlockBodyScroll = () => {
    if (typeof document === "undefined" || activeLocks === 0) return;

    activeLocks -= 1;

    if (activeLocks > 0 || !savedState) return;

    const body = document.body;
    const documentElement = document.documentElement;

    body.style.overflow = savedState.bodyOverflow;
    body.style.overscrollBehavior = savedState.bodyOverscrollBehavior;
    documentElement.style.overflow = savedState.documentOverflow;
    documentElement.style.overscrollBehavior = savedState.documentOverscrollBehavior;
    body.classList.remove("repeto-lp2-scroll-locked");
    documentElement.classList.remove("repeto-lp2-scroll-locked");
    savedState = null;
};

export const useBodyScrollLock = (enabled: boolean) => {
    useEffect(() => {
        if (!enabled) return;

        lockBodyScroll();
        return () => {
            unlockBodyScroll();
        };
    }, [enabled]);
};