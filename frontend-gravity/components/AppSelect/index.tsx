import { useRef, type CSSProperties, type ReactNode } from "react";
import { Select } from "@gravity-ui/uikit";

type AppSelectOption = {
    value: string;
    content: string;
    data?: Record<string, unknown>;
};

type AppSelectProps = {
    /* ── Field ── */
    label: string;
    required?: boolean;
    error?: string;
    half?: boolean;
    className?: string;
    style?: CSSProperties;

    /* ── Select ── */
    options: AppSelectOption[];
    value: string[];
    onUpdate: (value: string[]) => void;
    placeholder?: string;
    filterable?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    hasClear?: boolean;
    hasCounter?: boolean;

    /* ── Rendering ── */
    renderOption?: (option: any) => ReactNode;
    renderSelectedOption?: (option: any) => ReactNode;

    /* ── Layout / Popup ── */
    size?: "s" | "m" | "l" | "xl";
    width?: "max" | number;
    popupWidth?: "fit" | number;
    popupPlacement?:
        | "bottom-start"
        | "bottom"
        | "bottom-end"
        | "top-start"
        | "top"
        | "top-end"
        | Array<string>;
};

const GSelect = Select as any;

const AppSelect = ({
    /* field */
    label,
    required,
    error,
    half,
    className,
    style,
    /* select */
    options,
    value,
    onUpdate,
    placeholder,
    filterable,
    multiple,
    disabled,
    hasClear,
    hasCounter,
    /* render */
    renderOption,
    renderSelectedOption,
    /* layout */
    size = "xl",
    width = "max",
    popupWidth,
    popupPlacement = "bottom-start",
}: AppSelectProps) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;

        const target = event.target as HTMLElement | null;
        if (
            target?.closest(
                'button, select, input, textarea, [role="combobox"], [role="option"], [role="listbox"]',
            )
        ) {
            return;
        }

        const root = fieldRef.current;
        if (!root) return;

        const selectButton = root.querySelector(
            '.g-select-control__button, [role="combobox"], button',
        ) as HTMLButtonElement | null;
        if (!selectButton || selectButton.disabled) return;

        // Avoid racing with document-level outside click handlers in Select popup logic.
        event.preventDefault();
        event.stopPropagation();

        window.setTimeout(() => {
            selectButton.click();
            selectButton.focus();
        }, 0);
    };

    return (
        <div
            className={`app-field app-field--select${half ? " app-field--half" : ""} ${className || ""}`}
            style={style}
        >
            <div
                ref={fieldRef}
                className={`app-field__inner${error ? " app-field__inner--error" : ""}`}
                onClick={handleContainerClick}
            >
                <span className="app-field__label app-field__label--passthrough">
                    {label}
                    {required ? " *" : ""}
                </span>
                <div className="app-field__control">
                    <GSelect
                        options={options}
                        value={value}
                        onUpdate={onUpdate}
                        placeholder={placeholder}
                        filterable={filterable}
                        multiple={multiple}
                        disabled={disabled}
                        hasClear={hasClear}
                        hasCounter={hasCounter}
                        renderOption={renderOption}
                        renderSelectedOption={renderSelectedOption}
                        size={size}
                        width={width}
                        popupWidth={popupWidth}
                        popupClassName="app-select-popup"
                        popupPlacement={popupPlacement}
                    />
                </div>
            </div>
            {error && <span className="app-field__error">{error}</span>}
        </div>
    );
};

export default AppSelect;
export type { AppSelectOption, AppSelectProps };
