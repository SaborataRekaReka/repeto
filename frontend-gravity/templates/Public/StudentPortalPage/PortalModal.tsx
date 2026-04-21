import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type PortalModalProps = {
    open: boolean;
    onClose: () => void;
    onClosed?: () => void;
    ariaLabel: string;
    overlayClassName: string;
    overlayOpenClassName: string;
    panelClassName: string;
    panelOpenClassName: string;
    closeDelayMs?: number;
    children: ReactNode;
};

const PortalModal = ({
    open,
    onClose,
    onClosed,
    ariaLabel,
    overlayClassName,
    overlayOpenClassName,
    panelClassName,
    panelOpenClassName,
    closeDelayMs = 360,
    children,
}: PortalModalProps) => {
    const [mounted, setMounted] = useState(false);
    const [rendered, setRendered] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) {
            return;
        }

        if (open) {
            setRendered(true);
            setVisible(false);
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
            return () => cancelAnimationFrame(raf);
        }

        setVisible(false);
        return undefined;
    }, [mounted, open]);

    useEffect(() => {
        if (open || !rendered) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setRendered(false);
            onClosed?.();
        }, closeDelayMs);

        return () => window.clearTimeout(timerId);
    }, [closeDelayMs, onClosed, open, rendered]);

    useEffect(() => {
        if (!rendered) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose, rendered]);

    if (!mounted || !rendered || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <>
            <div
                className={`${overlayClassName}${visible ? ` ${overlayOpenClassName}` : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={`${panelClassName}${visible ? ` ${panelOpenClassName}` : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
            >
                {children}
            </div>
        </>,
        document.body
    );
};

export default PortalModal;
