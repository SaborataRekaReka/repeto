import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { Icon } from "@gravity-ui/uikit";
import { ArrowLeft } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

type PageOverlayProps = {
    /** Title shown below the breadcrumb */
    title: ReactNode;
    /** Optional breadcrumb above the title */
    breadcrumb?: string;
    /** Sidebar nav items */
    nav?: { key: string; label: string; icon?: IconData }[];
    /** Currently active nav key */
    activeNav?: string;
    /** Called when nav item is clicked */
    onNavChange?: (key: string) => void;
    /** Sidebar header (above nav, below title) — e.g. avatar + info */
    sidebarHeader?: ReactNode;
    /** Main content area */
    children: ReactNode;
    /** Where to go when back is clicked. Defaults to router.back() */
    backHref?: string;
};

const PageOverlay = ({
    title,
    nav,
    activeNav,
    onNavChange,
    sidebarHeader,
    children,
    backHref,
}: PageOverlayProps) => {
    const router = useRouter();
    const [visible, setVisible] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setVisible(true));
        // Prevent body scroll
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const handleBack = useCallback(() => {
        if (backHref) {
            // Navigate immediately to avoid showing the underlying layout for a split second.
            router.push(backHref);
            return;
        }

        setVisible(false);
        setTimeout(() => {
            router.back();
        }, 300);
    }, [backHref, router]);

    return (
        <div
            ref={overlayRef}
            className={`page-overlay${visible ? " page-overlay--visible" : ""}`}
        >
            {/* Back button */}
            <button
                type="button"
                className="page-overlay__back"
                onClick={handleBack}
                aria-label="Назад"
            >
                <Icon data={ArrowLeft as IconData} size={20} />
            </button>

            <div className="page-overlay__layout">
                {/* Sidebar */}
                <aside className="page-overlay__sidebar">
                    <h2 className="page-overlay__title">{title}</h2>

                    {sidebarHeader}

                    {nav && nav.length > 0 && (
                        <nav className="page-overlay__nav">
                            {nav.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    className={`page-overlay__nav-item${
                                        activeNav === item.key
                                            ? " page-overlay__nav-item--active"
                                            : ""
                                    }`}
                                    onClick={() => onNavChange?.(item.key)}
                                >
                                    {item.icon && (
                                        <Icon data={item.icon} size={18} />
                                    )}
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    )}
                </aside>

                {/* Content */}
                <main className="page-overlay__content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default PageOverlay;
