import { useEffect, useRef, useState } from "react";
import { Icon } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import type { AnimationItem } from "lottie-web";

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
    const [isReady, setIsReady] = useState(false);
    const [showFallback, setShowFallback] = useState(false);

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
            setShowFallback(false);
            setIsReady(true);
            loadedAnimation?.goToAndStop(0, true);
        };

        const handleDataFailed = () => {
            if (cancelled) {
                return;
            }
            setShowFallback(true);
        };

        const init = async () => {
            const { default: lottie } = await import("lottie-web");
            if (cancelled || !containerRef.current) {
                return;
            }

            loadedAnimation = lottie.loadAnimation({
                container: containerRef.current,
                renderer: "svg",
                loop: false,
                autoplay: false,
                path: src,
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
                setShowFallback(true);
            }, 1200);
        };

        setIsReady(false);
        setShowFallback(false);
        void init();

        return () => {
            cancelled = true;
            setIsReady(false);
            setShowFallback(false);
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
            {showFallback && (
                <span className="repeto-animated-sidebar-icon__fallback">
                    <Icon data={fallbackIcon} size={size} />
                </span>
            )}
        </span>
    );
};

export default AnimatedSidebarIcon;
