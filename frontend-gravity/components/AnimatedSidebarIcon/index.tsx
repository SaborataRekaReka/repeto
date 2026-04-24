import { useEffect, useRef, useState } from "react";
import { Icon } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import type { AnimationItem } from "lottie-web";

// Module-level cache: src → loaded animation data (JSON object)
// Persists across component remounts (page navigations)
const lottieDataCache = new Map<string, object>();

type AnimatedSidebarIconProps = {
    src: string;
    play: boolean;
    fallbackIcon: IconData;
    size?: number;
    className?: string;
};

const AnimatedSidebarIcon = ({
    src,
    play,
    fallbackIcon,
    size = 25,
    className = "",
}: AnimatedSidebarIconProps) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const animationRef = useRef<AnimationItem | null>(null);
    const prefersReducedMotionRef = useRef(false);
    // If JSON data is already cached, start in ready state to skip fallback flash
    const [isReady, setIsReady] = useState(() => lottieDataCache.has(src));
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        prefersReducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) {
            return;
        }

        let cancelled = false;
        let loadedAnimation: AnimationItem | null = null;
        let domLoaded = false;
        let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

        const handleDomLoaded = () => {
            if (cancelled) {
                return;
            }
            domLoaded = true;
            setLoadFailed(false);
            setIsReady(true);
            loadedAnimation?.goToAndStop(0, true);
        };

        const handleDataFailed = () => {
            if (cancelled) {
                return;
            }
            setLoadFailed(true);
        };

        const init = async () => {
            const { default: lottie } = await import("lottie-web");
            if (cancelled || !containerRef.current) {
                return;
            }

            // Use cached data if available to avoid re-fetch on navigation
            let cachedData = lottieDataCache.get(src);
            if (!cachedData) {
                try {
                    const resp = await fetch(src);
                    if (!resp.ok) throw new Error("fetch failed");
                    cachedData = await resp.json() as object;
                    lottieDataCache.set(src, cachedData);
                } catch {
                    if (!cancelled) setLoadFailed(true);
                    return;
                }
            }

            if (cancelled || !containerRef.current) {
                return;
            }

            loadedAnimation = lottie.loadAnimation({
                container: containerRef.current,
                renderer: "svg",
                loop: false,
                autoplay: false,
                animationData: cachedData,
                rendererSettings: {
                    preserveAspectRatio: "xMidYMid meet",
                    progressiveLoad: true,
                },
            });

            animationRef.current = loadedAnimation;
            loadedAnimation.addEventListener("DOMLoaded", handleDomLoaded);
            loadedAnimation.addEventListener("data_failed", handleDataFailed);

            fallbackTimer = setTimeout(() => {
                if (cancelled || domLoaded) {
                    return;
                }
                setLoadFailed(true);
            }, 1200);
        };

        // Only flash fallback if data not yet cached
        if (!lottieDataCache.has(src)) {
            setIsReady(false);
        }
        setLoadFailed(false);
        void init();
        return () => {
            cancelled = true;
            setIsReady(false);
            setLoadFailed(false);
            if (fallbackTimer) {
                clearTimeout(fallbackTimer);
            }
            if (loadedAnimation) {
                loadedAnimation.removeEventListener("DOMLoaded", handleDomLoaded);
                loadedAnimation.removeEventListener("data_failed", handleDataFailed);
                loadedAnimation.destroy();
            }
            animationRef.current = null;
        };
    }, [src]);

    useEffect(() => {
        const animation = animationRef.current;
        if (!animation || !isReady) {
            return;
        }

        if (play && !prefersReducedMotionRef.current) {
            animation.stop();
            animation.play();
            return;
        }

        animation.stop();
        animation.goToAndStop(0, true);
    }, [isReady, play]);

    return (
        <span
            className={`repeto-animated-sidebar-icon ${className}`.trim()}
            style={{ width: size, height: size }}
            aria-hidden="true"
        >
            <span
                ref={containerRef}
                className={`repeto-animated-sidebar-icon__canvas ${
                    isReady ? "repeto-animated-sidebar-icon__canvas--ready" : ""
                }`}
            />
            <span
                className={`repeto-animated-sidebar-icon__fallback ${
                    isReady && !loadFailed ? "repeto-animated-sidebar-icon__fallback--hidden" : ""
                }`}
            >
                <Icon data={fallbackIcon} size={size} />
            </span>
        </span>
    );
};

export default AnimatedSidebarIcon;
