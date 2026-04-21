import type { ReactNode, CSSProperties } from "react";
import AppField from "@/components/AppField";

type Lp2FieldProps = {
    label: string;
    children: ReactNode;
    error?: boolean;
    errorText?: string;
    half?: boolean;
    style?: CSSProperties;
};

const Lp2Field = ({ label, children, error, errorText, half, style }: Lp2FieldProps) => {
    return (
        <AppField
            label={label}
            error={error ? (errorText || " ") : undefined}
            half={half}
            style={style}
        >
            {children}
        </AppField>
    );
};

const Lp2Row = ({ children }: { children: ReactNode }) => (
    <div className="app-field-row">{children}</div>
);

export { Lp2Field, Lp2Row };
export default Lp2Field;
