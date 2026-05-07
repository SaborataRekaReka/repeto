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
                <Link href="/" className="repeto-public-brand" aria-label="Repeto">
                    <Text variant="subheader-2">Repeto</Text>
                </Link>
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
                    className="repeto-public-footer__link"
                >
                    Repeto
                </Link>
                {" · "}
                <Link
                    href="/legal"
                    className="repeto-public-footer__link"
                >
                    Юридическая информация
                </Link>
            </Text>
        </div>
    );
};
