import { useRef, type CSSProperties, type ReactNode } from "react";

type AppFieldProps = {
    label: string;
    children: ReactNode;
    required?: boolean;
    error?: string;
    half?: boolean;
    className?: string;
    style?: CSSProperties;
};

const AppField = ({
    label,
    children,
    required,
    error,
    half,
    className,
    style,
}: AppFieldProps) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;

        const target = event.target as HTMLElement | null;
        if (
            target?.closest(
                'input, textarea, button, select, [role="combobox"], [role="option"], [role="listbox"]',
            )
        ) {
            return;
        }

        const root = fieldRef.current;
        if (!root) return;

        const selectTrigger = root.querySelector(
            '.g-select-control__button, button[role="combobox"], [role="combobox"]',
        ) as HTMLElement | null;
        if (selectTrigger) {
            const isDisabled =
                selectTrigger.hasAttribute("disabled") ||
                selectTrigger.getAttribute("aria-disabled") === "true";
            if (!isDisabled) {
                // Avoid racing with document-level outside click handlers in Select popup logic.
                event.preventDefault();
                event.stopPropagation();

                window.setTimeout(() => {
                    selectTrigger.click();
                    selectTrigger.focus();
                }, 0);
            }
            return;
        }

        const textControl = root.querySelector(
            "input, textarea",
        ) as HTMLElement | null;
        if (textControl) {
            textControl.focus();
            return;
        }

        const btn = root.querySelector("button") as HTMLButtonElement | null;
        if (btn) {
            btn.focus();
        }
    };

    return (
        <div
            className={`app-field${half ? " app-field--half" : ""} ${className || ""}`}
            style={style}
        >
            <div
                ref={fieldRef}
                className={`app-field__inner${error ? " app-field__inner--error" : ""}`}
                onClick={handleClick}
            >
                <span className="app-field__label">
                    {label}
                    {required ? " *" : ""}
                </span>
                <div className="app-field__control">{children}</div>
            </div>
            {error && <span className="app-field__error">{error}</span>}
        </div>
    );
};

export default AppField;
