import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, Icon } from "@gravity-ui/uikit";
import {
    ArrowLeft,
    ArrowUpRightFromSquare,
    ChevronRight,
    Copy,
    CreditCard,
    File as FileIcon,
    Xmark,
} from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type {
    PortalBalanceOperation,
    PortalPayment,
    StudentPortalData,
} from "@/types/student-portal";
import PortalModal from "./PortalModal";

type PaymentTabProps = {
    data: StudentPortalData;
};

const INITIAL_OPERATIONS_COUNT = 3;

type RequisiteItem = {
    id: string;
    label: string;
    value: string;
};

function formatAbsoluteAmount(value: number) {
    return `${Math.abs(value).toLocaleString("ru-RU")} ₽`;
}

function formatPaymentMethod(method: string) {
    const normalized = String(method || "").trim().toLowerCase();

    if (normalized === "sbp") return "СБП";
    if (normalized === "cash") return "Наличные";
    if (normalized === "yukassa") return "ЮKassa";
    if (normalized === "transfer") return "Перевод";
    if (normalized === "перевод") return "Перевод";

    return "Перевод";
}

function normalizeCardNumber(value: string): string | null {
    const compactDigits = value.match(/\d/g)?.join("") || "";
    if (compactDigits.length >= 16 && compactDigits.length <= 20) {
        const chunks = compactDigits.match(/.{1,4}/g);
        return chunks ? chunks.join(" ") : compactDigits;
    }

    const matches = value.match(/(?:\d[\s-]*){16,20}/g) || [];
    for (const match of matches) {
        const digits = match.match(/\d/g)?.join("") || "";
        if (digits.length >= 16 && digits.length <= 20) {
            const chunks = digits.match(/.{1,4}/g);
            return chunks ? chunks.join(" ") : digits;
        }
    }

    return null;
}

function extractCardNumber(raw?: string | null): string | null {
    const source = String(raw || "").trim();
    if (!source) {
        return null;
    }

    const direct = normalizeCardNumber(source);
    if (direct) {
        return direct;
    }

    const matches = source.match(/(?:\d[\s-]*){16,19}/g) || [];
    for (const match of matches) {
        const normalized = normalizeCardNumber(match);
        if (normalized) {
            return normalized;
        }
    }

    return null;
}

function formatSbpPhone(value: string): string {
    const digits = value.match(/\d/g)?.join("") || "";

    if (digits.length === 10) {
        const full = `7${digits}`;
        return `+7 ${full.slice(1, 4)} ${full.slice(4, 7)}-${full.slice(7, 9)}-${full.slice(9, 11)}`;
    }

    if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
        const full = `7${digits.slice(1)}`;
        return `+7 ${full.slice(1, 4)} ${full.slice(4, 7)}-${full.slice(7, 9)}-${full.slice(9, 11)}`;
    }

    return String(value || "").trim();
}

function extractSbpPhone(raw?: string | null): string | null {
    const source = String(raw || "").trim();
    if (!source) {
        return null;
    }

    const sbpLine = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => /сбп/i.test(line));

    if (sbpLine) {
        const formatted = formatSbpPhone(sbpLine);
        if (formatted) {
            return formatted;
        }
    }

    const phoneCandidates = source.match(/(?:\+7|8)[\d\s().-]{9,20}\d/g) || [];
    for (const candidate of phoneCandidates) {
        const formatted = formatSbpPhone(candidate);
        if (formatted) {
            return formatted;
        }
    }

    return null;
}

function buildFallbackOperations(payments: PortalPayment[]): PortalBalanceOperation[] {
    return payments.map((payment) => ({
        id: `payment-${payment.id}`,
        kind: "payment",
        direction: "credit",
        amount: payment.amount,
        title: `Оплата · ${formatPaymentMethod(payment.method)}`,
        subtitle: payment.date,
        occurredAt: payment.date,
    }));
}

const PaymentTab = ({ data }: PaymentTabProps) => {
    const [showAllOperations, setShowAllOperations] = useState(false);
    const [requisitesOpen, setRequisitesOpen] = useState(false);
    const [copyState, setCopyState] = useState<{
        key: string;
        status: "success" | "error";
    } | null>(null);

    const closeRequisites = useCallback(() => {
        setRequisitesOpen(false);
    }, []);

    const paymentCardNumber = useMemo(
        () => data.paymentCardNumber || extractCardNumber(data.paymentRequisites),
        [data.paymentCardNumber, data.paymentRequisites]
    );

    const paymentSbpPhone = useMemo(
        () => data.paymentSbpPhone || extractSbpPhone(data.paymentRequisites),
        [data.paymentSbpPhone, data.paymentRequisites]
    );

    const hasDebt = data.balance < 0;
    const hasRequisites = Boolean(
        data.paymentRequisites?.trim() || paymentCardNumber || paymentSbpPhone
    );
    const canPay = Boolean(data.paymentUrl || hasRequisites);
    const packagePercent = data.package
        ? Math.min(
              100,
              Math.round((data.package.used / Math.max(1, data.package.total)) * 100)
          )
        : 0;
    const packageLeft = data.package
        ? Math.max(data.package.total - data.package.used, 0)
        : 0;

    const allOperations = useMemo(
        () =>
            data.balanceOperations && data.balanceOperations.length > 0
                ? data.balanceOperations
                : buildFallbackOperations(data.recentPayments || []),
        [data.balanceOperations, data.recentPayments]
    );

    const visibleOperations = showAllOperations
        ? allOperations
        : allOperations.slice(0, INITIAL_OPERATIONS_COUNT);

    const requisitesLines = (data.paymentRequisites || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const requisitesItems = useMemo<RequisiteItem[]>(() => {
        const items: RequisiteItem[] = [];
        const cardDigits = paymentCardNumber?.match(/\d/g)?.join("") || "";
        const sbpDigits = paymentSbpPhone?.match(/\d/g)?.join("") || "";

        if (paymentCardNumber) {
            items.push({
                id: "card-number",
                label: "Номер карты",
                value: paymentCardNumber,
            });
        }

        if (paymentSbpPhone) {
            items.push({
                id: "sbp-phone",
                label: "Номер телефона для СБП",
                value: paymentSbpPhone,
            });
        }

        requisitesLines.forEach((line, index) => {
            const lineDigits = line.match(/\d/g)?.join("") || "";

            if (cardDigits && lineDigits.includes(cardDigits)) {
                return;
            }

            if (sbpDigits && lineDigits.includes(sbpDigits)) {
                return;
            }

            items.push({
                id: `line-${index}`,
                label: "Реквизиты",
                value: line,
            });
        });

        return items;
    }, [paymentCardNumber, paymentSbpPhone, requisitesLines]);

    const requisitesTextForCopy = useMemo(() => {
        if (data.paymentRequisites?.trim()) {
            return data.paymentRequisites;
        }

        return requisitesItems
            .map((item) => `${item.label}: ${item.value}`)
            .join("\n")
            .trim();
    }, [data.paymentRequisites, requisitesItems]);

    const inlineRequisitesValue =
        data.paymentRequisitesPreview ||
        paymentCardNumber ||
        paymentSbpPhone ||
        requisitesLines[0] ||
        "Открыть реквизиты";

    const balanceCaption = hasDebt
        ? "К оплате"
        : data.balance > 0
          ? "На балансе"
          : "Баланс";

    const scrollToOperations = () => {
        if (typeof document === "undefined") return;
        document
            .getElementById("repeto-portal-payment-operations")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const openRequisites = () => {
        if (!hasRequisites) return;
        setCopyState(null);
        setRequisitesOpen(true);
    };

    const handleCopyValue = async (
        value: string,
        key: string,
        event?: React.MouseEvent<HTMLButtonElement>
    ) => {
        event?.stopPropagation();

        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);
            setCopyState({ key, status: "success" });
        } catch {
            setCopyState({ key, status: "error" });
        }
    };

    const handleCopyRequisites = async (
        event?: React.MouseEvent<HTMLButtonElement>
    ) => {
        await handleCopyValue(requisitesTextForCopy, "all-requisites", event);
    };

    return (
        <>
            <div className="repeto-portal-balance-layout">
                <section className="repeto-portal-balance-hero">
                    <div className="repeto-portal-balance-hero__caption">
                        {balanceCaption}
                    </div>
                    <div
                        className={`repeto-portal-balance-hero__amount${
                            hasDebt ? " repeto-portal-balance-hero__amount--debt" : ""
                        }`}
                    >
                        {data.balance.toLocaleString("ru-RU")} ₽
                    </div>

                    <button
                        type="button"
                        className="repeto-portal-balance-hero__jump"
                        onClick={scrollToOperations}
                    >
                        <span>Детализация</span>
                        <Icon data={ChevronRight as IconData} size={16} />
                    </button>

                    <div className="repeto-portal-balance-hero__actions">
                        {canPay && (
                            data.paymentUrl ? (
                                <a
                                    href={data.paymentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="repeto-portal-balance-chip repeto-portal-balance-chip--primary"
                                >
                                    <Icon data={CreditCard as IconData} size={16} />
                                    <span>Пополнить баланс</span>
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    className="repeto-portal-balance-chip repeto-portal-balance-chip--primary"
                                    onClick={openRequisites}
                                >
                                    <Icon data={CreditCard as IconData} size={16} />
                                    <span>Пополнить баланс</span>
                                </button>
                            )
                        )}

                        {hasRequisites && (
                            <div className="repeto-portal-balance-inline-requisites">
                                <div className="repeto-portal-balance-inline-requisites__copy">
                                    <div className="repeto-portal-balance-inline-requisites__title">
                                        Реквизиты счета
                                    </div>
                                    <div className="repeto-portal-balance-inline-requisites__value">
                                        {inlineRequisitesValue}
                                    </div>
                                </div>
                                <div className="repeto-portal-balance-inline-requisites__actions">
                                    <button
                                        type="button"
                                        className="repeto-portal-balance-inline-requisites__icon-btn"
                                        onClick={handleCopyRequisites}
                                        aria-label="Скопировать реквизиты"
                                    >
                                        <Icon data={Copy as IconData} size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className="repeto-portal-balance-inline-requisites__icon-btn"
                                        onClick={openRequisites}
                                        aria-label="Открыть реквизиты"
                                    >
                                        <Icon data={ArrowUpRightFromSquare as IconData} size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {data.package && (
                    <section className="repeto-portal-balance-package-card repeto-portal-balance-package-card--full">
                        <div className="repeto-portal-balance-package-card__head">
                            <div>
                                <div className="repeto-portal-balance-package-card__title">
                                    {data.package.subject
                                        ? `Пакет «${data.package.subject}»`
                                        : "Активный пакет"}
                                </div>
                                <div className="repeto-portal-balance-package-card__subtitle">
                                    Осталось {packageLeft} из {data.package.total} занятий
                                </div>
                            </div>

                            {data.package.validUntil && (
                                <div className="repeto-portal-balance-package-card__meta">
                                    до {data.package.validUntil}
                                </div>
                            )}
                        </div>

                        <div className="repeto-portal-balance-package-card__progress">
                            <div
                                className="repeto-portal-balance-package-card__progress-bar"
                                style={{ width: `${packagePercent}%` }}
                            />
                        </div>

                        <div className="repeto-portal-balance-package-card__foot">
                            <span>Использовано {data.package.used}</span>
                            <span>из {data.package.total}</span>
                        </div>
                    </section>
                )}

                <section
                    id="repeto-portal-payment-operations"
                    className="repeto-portal-balance-operations"
                >
                    <div className="repeto-portal-balance-operations__head">
                        <div className="repeto-portal-balance-operations__title">
                            Операции
                        </div>
                        <Icon data={ChevronRight as IconData} size={18} />
                    </div>

                    {visibleOperations.length === 0 ? (
                        <Text variant="body-2" color="secondary">
                            Пока нет операций.
                        </Text>
                    ) : (
                        <div className="repeto-portal-balance-operations__list">
                            {visibleOperations.map((operation) => (
                                <div
                                    key={operation.id}
                                    className="repeto-portal-balance-operation-row"
                                >
                                    <span
                                        className={`repeto-portal-balance-operation-row__icon repeto-portal-balance-operation-row__icon--${operation.kind}`}
                                    >
                                        <Icon
                                            data={(operation.kind === "payment"
                                                ? CreditCard
                                                : FileIcon) as IconData}
                                            size={18}
                                        />
                                    </span>

                                    <div className="repeto-portal-balance-operation-row__copy">
                                        <div className="repeto-portal-balance-operation-row__title">
                                            {operation.title}
                                        </div>
                                        <div className="repeto-portal-balance-operation-row__subtitle">
                                            {operation.subtitle}
                                        </div>
                                    </div>

                                    <div
                                        className={`repeto-portal-balance-operation-row__amount repeto-portal-balance-operation-row__amount--${operation.direction}`}
                                    >
                                        {operation.direction === "credit" ? "+" : "−"}
                                        {formatAbsoluteAmount(operation.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {allOperations.length > INITIAL_OPERATIONS_COUNT && (
                        <button
                            type="button"
                            className="repeto-portal-balance-operations__toggle"
                            onClick={() => setShowAllOperations((prev) => !prev)}
                        >
                            {showAllOperations ? "Свернуть" : "Показать все"}
                        </button>
                    )}
                </section>
            </div>

            <PortalModal
                open={requisitesOpen}
                onClose={closeRequisites}
                ariaLabel="Реквизиты"
                overlayClassName="repeto-portal-requisites-overlay"
                overlayOpenClassName="repeto-portal-requisites-overlay--open"
                panelClassName="repeto-portal-requisites-panel"
                panelOpenClassName="repeto-portal-requisites-panel--open"
            >
                <div className="repeto-portal-requisites-panel__topbar">
                    <button
                        type="button"
                        className="lp2__back"
                        onClick={closeRequisites}
                        aria-label="Назад"
                    >
                        <Icon data={ArrowLeft as IconData} size={18} />
                    </button>
                    <Text variant="subheader-2">Реквизиты {data.tutorName}</Text>
                    <button
                        type="button"
                        className="repeto-portal-requisites-panel__close"
                        onClick={closeRequisites}
                        aria-label="Закрыть"
                    >
                        <Icon data={Xmark as IconData} size={22} />
                    </button>
                </div>

                <div className="repeto-portal-requisites-panel__scroll">
                    <Text variant="header-1" className="repeto-portal-requisites-panel__title">
                        Реквизиты
                    </Text>

                    {requisitesItems.length === 0 ? (
                        <Text variant="body-1" color="secondary">
                            Реквизиты пока не заполнены.
                        </Text>
                    ) : (
                        <div className="repeto-portal-requisites-panel__list">
                            {requisitesItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="repeto-portal-requisites-panel__row"
                                >
                                    <div className="repeto-portal-requisites-panel__row-copy">
                                        <div className="repeto-portal-requisites-panel__row-label">
                                            {item.label}
                                        </div>
                                        <div className="repeto-portal-requisites-panel__row-value">
                                            {item.value}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="repeto-portal-requisites-panel__row-copy-btn"
                                        onClick={(event) =>
                                            void handleCopyValue(item.value, item.id, event)
                                        }
                                        aria-label={`Скопировать: ${item.label}`}
                                    >
                                        <Icon data={Copy as IconData} size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {copyState && (
                        <Text
                            variant="caption-2"
                            className={`repeto-portal-requisites-panel__copy-status${
                                copyState.status === "success"
                                    ? " repeto-portal-requisites-panel__copy-status--ok"
                                    : " repeto-portal-requisites-panel__copy-status--error"
                            }`}
                        >
                            {copyState.status === "success"
                                ? "Реквизит скопирован"
                                : "Не удалось скопировать"}
                        </Text>
                    )}
                </div>
            </PortalModal>
        </>
    );
};

export default PaymentTab;
