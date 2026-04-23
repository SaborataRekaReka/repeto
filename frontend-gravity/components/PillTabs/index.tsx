import React from "react";

export type PillTabOption<T extends string = string> = {
    value: T;
    label: string;
    count?: number | string;
};

type PillTabsProps<T extends string> = {
    value: T;
    onChange: (value: T) => void;
    options: PillTabOption<T>[];
    size?: "s" | "m";
    className?: string;
    ariaLabel?: string;
};

/**
 * Tochka-style pill tabs: active = purple filled, inactive = light grey.
 * The unified "mini-tab" across the app (schedule view toggles, notifications,
 * finance/dashboard widget toggles, etc.).
 */
function PillTabs<T extends string>({
    value,
    onChange,
    options,
    size = "m",
    className,
    ariaLabel,
}: PillTabsProps<T>) {
    const cls = `repeto-pill-tabs repeto-pill-tabs--${size}${className ? " " + className : ""}`;
    return (
        <div className={cls} role="tablist" aria-label={ariaLabel}>
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`repeto-pill-tab${active ? " repeto-pill-tab--active" : ""}`}
                        onClick={() => {
                            if (!active) onChange(opt.value);
                        }}
                    >
                        <span className="repeto-pill-tab__label">{opt.label}</span>
                        {opt.count !== undefined && opt.count !== null && opt.count !== "" && (
                            <span className="repeto-pill-tab__count">{opt.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default PillTabs;
