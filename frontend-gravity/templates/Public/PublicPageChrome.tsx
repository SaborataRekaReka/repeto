import type { ReactNode } from "react";
import Link from "next/link";
import { Text } from "@gravity-ui/uikit";

type PublicPageHeaderProps = {
    containerClassName: string;
    rightContent?: ReactNode;
};

type PublicPageFooterProps = {
    className?: string;
};

export const PublicPageHeader = ({
    containerClassName,
    rightContent,
}: PublicPageHeaderProps) => {
    return (
        <div className="repeto-portal-header">
            <div className={`${containerClassName} repeto-portal-header__inner`}>
                <Text variant="subheader-2">Repeto</Text>
                {rightContent ? (
                    <div className="repeto-portal-header__right">{rightContent}</div>
                ) : null}
            </div>
        </div>
    );
};

export const PublicPageFooter = ({ className }: PublicPageFooterProps) => {
    return (
        <div className={["repeto-portal-footer", className].filter(Boolean).join(" ")}>
            <Text variant="caption-2" color="secondary">
                Работает на{" "}
                <Link
                    href="/"
                    style={{
                        fontWeight: 600,
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    Repeto
                </Link>
            </Text>
        </div>
    );
};
