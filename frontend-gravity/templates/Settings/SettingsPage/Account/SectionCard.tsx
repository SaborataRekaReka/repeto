import { Card, Text } from "@gravity-ui/uikit";

type SectionCardProps = {
    title: string;
    action?: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    bodyStyle?: React.CSSProperties;
    children: React.ReactNode;
    titleSlot?: React.ReactNode;
};

const SectionCard = ({ title, action, className, bodyClassName, bodyStyle, children, titleSlot }: SectionCardProps) => {
    const headerStyle: React.CSSProperties = {
        padding: action ? "16px 24px" : "20px 24px",
        borderBottom: "1px solid var(--g-color-line-generic)",
        ...(action ? { display: "flex", alignItems: "center", justifyContent: "space-between" } : null),
    };

    return (
        <Card className={`repeto-settings-section-card${className ? ` ${className}` : ""}`} view="outlined">
            <div className="repeto-settings-card__header" style={headerStyle}>
                {titleSlot ?? <Text variant="subheader-2">{title}</Text>}
                {action}
            </div>
            <div
                className={`repeto-settings-card__body${bodyClassName ? ` ${bodyClassName}` : ""}`}
                style={{ padding: 24, ...bodyStyle }}
            >
                {children}
            </div>
        </Card>
    );
};

export default SectionCard;
