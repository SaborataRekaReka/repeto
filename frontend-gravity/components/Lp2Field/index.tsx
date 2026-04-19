import { useRef } from "react";
import type { ReactNode, CSSProperties, MouseEvent } from "react";

type Lp2FieldProps = {
    label: string;
    children: ReactNode;
    error?: boolean;
    errorText?: string;
    half?: boolean;
    style?: CSSProperties;
};

const Lp2Field = ({ label, children, error, errorText, half, style }: Lp2FieldProps) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;

        const target = e.target as HTMLElement | null;
        if (
            target?.closest(
                "input, textarea, button, [role='combobox'], [role='listbox'], [role='option'], .g-popup, .g-select-popup, .g-select-list",
            )
        ) {
            return;
        }

        const root = fieldRef.current;
        if (!root) return;

        const selectButton = root.querySelector(
            ".g-select-control__button",
        ) as HTMLButtonElement | null;
        if (selectButton) {
            e.preventDefault();
            selectButton.focus();
            selectButton.click();
            return;
        }

        const dateButton = root.querySelector("button") as HTMLButtonElement | null;
        if (dateButton) {
            e.preventDefault();
            dateButton.focus();
            dateButton.click();
            return;
        }

        const textControl = root.querySelector("input, textarea") as
            | HTMLInputElement
            | HTMLTextAreaElement
            | null;
        if (textControl) {
            e.preventDefault();
            textControl.focus();
        }
    };

    return (
        <div className={`lp2-field${half ? " lp2-field--half" : ""}`} style={style}>
            <div
                ref={fieldRef}
                className={`lp2-field__inner${error ? " lp2-field__inner--error" : ""}`}
                onMouseDown={handleMouseDown}
            >
                <div className="lp2-field__label">{label}</div>
                <div className="lp2-field__control">{children}</div>
            </div>
            {error && errorText && (
                <div className="lp2-field__error">{errorText}</div>
            )}
        </div>
    );
};

const Lp2Row = ({ children }: { children: ReactNode }) => (
    <div className="lp2-row">{children}</div>
);

export { Lp2Field, Lp2Row };
export default Lp2Field;
