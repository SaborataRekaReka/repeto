import { ArrowLeft } from "@gravity-ui/icons";
import { Icon } from "@gravity-ui/uikit";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode, Ref } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useModalEscape } from "@/hooks/useModalEscape";

type Lp2PlannerHeaderProps = {
    title: ReactNode;
    subtitle?: ReactNode;
    onBack?: () => void;
    backAriaLabel?: string;
    actions?: ReactNode;
};

type Lp2PlannerLayoutProps = {
    children: ReactNode;
    className?: string;
};

type Lp2PlannerSectionProps = {
    title?: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
};

type Lp2PlannerFooterProps = {
    children: ReactNode;
};

type Lp2PlannerShellProps = {
    panelRef?: Ref<HTMLDivElement>;
    className?: string;
    style?: CSSProperties;
    isOpen: boolean;
    onTransitionEnd?: () => void;
    ariaLabel: string;
    ariaModal?: boolean;
    onBack?: () => void;
    backAriaLabel?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    topbarActions?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    centerClassName?: string;
    withPlannerClass?: boolean;
    withPlannerCenter?: boolean;
};

type Lp2PortalShellProps = Omit<Lp2PlannerShellProps, "isOpen" | "onTransitionEnd"> & {
    open: boolean;
    onClose: () => void;
    onClosed?: () => void;
    overlayClassName?: string;
    overlayOpenClassName?: string;
    closeDelayMs?: number;
};

export const Lp2PlannerHeader = ({
    title,
    subtitle,
    onBack,
    backAriaLabel = "Назад",
    actions,
}: Lp2PlannerHeaderProps) => {
    return (
        <div className="lp2__topbar lp2__topbar--lesson-planner">
            <div className="lp2-lesson-header__left">
                {onBack ? (
                    <button type="button" className="lp2__back" onClick={onBack} aria-label={backAriaLabel}>
                        <Icon data={ArrowLeft} size={18} />
                    </button>
                ) : null}
                <div className="lp2-lesson-header__copy">
                    <h1 className="lp2-lesson-header__title">{title}</h1>
                    {subtitle ? <div className="lp2-lesson-header__subtitle">{subtitle}</div> : null}
                </div>
            </div>
            <div className="lp2__topbar-actions lp2__topbar-actions--lesson-planner">{actions}</div>
        </div>
    );
};

export const Lp2PlannerLayout = ({ children, className }: Lp2PlannerLayoutProps) => {
    const layoutClassName = ["lp2-lesson-layout", className || ""].filter(Boolean).join(" ");
    return <div className={layoutClassName}>{children}</div>;
};

export const Lp2PlannerSection = ({
    title,
    description,
    children,
    className,
    bodyClassName,
}: Lp2PlannerSectionProps) => {
    const sectionClassName = ["lp2-lesson-section", className || ""].filter(Boolean).join(" ");
    const sectionBodyClassName = ["lp2-lesson-section__body", bodyClassName || ""].filter(Boolean).join(" ");

    return (
        <section className={sectionClassName}>
            {title ? <h3 className="lp2-lesson-section__title">{title}</h3> : null}
            {description ? <div className="lp2-lesson-section__description">{description}</div> : null}
            <div className={sectionBodyClassName}>{children}</div>
        </section>
    );
};

export const Lp2PlannerFooter = ({ children }: Lp2PlannerFooterProps) => {
    return <div className="lp2__bottombar">{children}</div>;
};

export const Lp2PortalShell = ({
    open,
    onClose,
    onClosed,
    overlayClassName = "lp2-overlay",
    overlayOpenClassName = "lp2-overlay--open",
    closeDelayMs = 360,
    ...shellProps
}: Lp2PortalShellProps) => {
    const [mounted, setMounted] = useState(false);
    const [rendered, setRendered] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (open) {
            setRendered(true);
            setVisible(false);
            let raf1 = 0;
            let raf2 = 0;
            raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => setVisible(true));
            });

            return () => {
                cancelAnimationFrame(raf1);
                cancelAnimationFrame(raf2);
            };
        }

        setVisible(false);
        return undefined;
    }, [mounted, open]);

    useEffect(() => {
        if (open || !rendered) return;

        const timerId = window.setTimeout(() => {
            setRendered(false);
            onClosed?.();
        }, closeDelayMs);

        return () => window.clearTimeout(timerId);
    }, [closeDelayMs, onClosed, open, rendered]);

    useModalEscape({ enabled: rendered, onEscape: onClose });

    if (!mounted || !rendered || typeof document === "undefined") return null;

    return createPortal(
        <>
            <div
                className={`${overlayClassName}${visible ? ` ${overlayOpenClassName}` : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <Lp2PlannerShell {...shellProps} isOpen={visible} />
        </>,
        document.body,
    );
};

const Lp2PlannerShell = ({
    panelRef,
    className,
    style,
    isOpen,
    onTransitionEnd,
    ariaLabel,
    ariaModal = false,
    onBack,
    backAriaLabel,
    title,
    subtitle,
    topbarActions,
    children,
    footer,
    centerClassName,
    withPlannerClass = true,
    withPlannerCenter = true,
}: Lp2PlannerShellProps) => {
    useBodyScrollLock(isOpen);

    const panelClassName = [
        "lp2",
        withPlannerClass ? "lp2--lesson-planner" : "",
        className || "",
        isOpen ? "lp2--open" : "",
    ]
        .filter(Boolean)
        .join(" ");

    const centerClasses = [
        "lp2__center",
        withPlannerCenter ? "lp2__center--lesson-planner" : "",
        centerClassName || "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            ref={panelRef}
            className={panelClassName}
            style={style}
            onTransitionEnd={onTransitionEnd}
            role="dialog"
            aria-modal={ariaModal}
            aria-label={ariaLabel}
        >
            <Lp2PlannerHeader
                title={title}
                subtitle={subtitle}
                onBack={onBack}
                backAriaLabel={backAriaLabel}
                actions={topbarActions}
            />

            <div className="lp2__scroll">
                <div className={centerClasses}>{children}</div>
            </div>

            {footer ? <Lp2PlannerFooter>{footer}</Lp2PlannerFooter> : null}
        </div>
    );
};

export default Lp2PlannerShell;
