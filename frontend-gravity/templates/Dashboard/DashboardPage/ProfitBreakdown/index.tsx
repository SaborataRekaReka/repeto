import { useMemo } from "react";
import Link from "next/link";
import { Card, Loader, Icon } from "@gravity-ui/uikit";
import { ChevronRight } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useIncomeChart } from "@/hooks/useDashboard";

const MONTH_GENITIVE = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
];

const formatRub = (value: number) =>
    `${Math.round(value).toLocaleString("ru-RU")}\u00A0₽`;

const formatPct = (value: number) => {
    if (!Number.isFinite(value)) return "0%";
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${rounded.toLocaleString("ru-RU")}%`;
};

const ProfitBreakdown = () => {
    const { data, loading } = useIncomeChart("month");

    const monthLabel = useMemo(() => MONTH_GENITIVE[new Date().getMonth()], []);

    const received = data?.current?.received ?? 0;
    const expected = data?.current?.expected ?? 0;
    const total = received + expected;
    const receivedPct = total > 0 ? (received / total) * 100 : 0;
    const expectedPct = total > 0 ? (expected / total) * 100 : 0;

    return (
        <Card className="repeto-profit-breakdown" view="outlined">
            {loading && !data ? (
                <div className="repeto-profit-breakdown__loader">
                    <Loader size="s" />
                </div>
            ) : (
                <>
                    <header className="repeto-profit-breakdown__header">
                        <div className="repeto-profit-breakdown__titles">
                            <span className="repeto-profit-breakdown__title">
                                Прибыль и ожидаемая прибыль
                            </span>
                            <span className="repeto-profit-breakdown__subtitle">
                                Фактические оплаты и запланированные начисления за {monthLabel}
                            </span>
                        </div>
                        <Link
                            href="/finance"
                            className="repeto-profit-breakdown__link"
                            aria-label="Открыть финансы"
                        >
                            <Icon data={ChevronRight as IconData} size={18} />
                        </Link>
                    </header>

                    <div className="repeto-profit-breakdown__bar">
                        {total === 0 && (
                            <span className="repeto-profit-breakdown__bar-empty" />
                        )}
                        {received > 0 && (
                            <span
                                className="repeto-profit-breakdown__bar-part repeto-profit-breakdown__bar-part--received"
                                style={{ flexBasis: `${receivedPct}%` }}
                                title={`Получено: ${formatPct(receivedPct)} (${formatRub(received)})`}
                            />
                        )}
                        {expected > 0 && (
                            <span
                                className="repeto-profit-breakdown__bar-part repeto-profit-breakdown__bar-part--expected"
                                style={{ flexBasis: `${expectedPct}%` }}
                                title={`Запланировано: ${formatPct(expectedPct)} (${formatRub(expected)})`}
                            />
                        )}
                    </div>

                    <ul className="repeto-profit-breakdown__list">
                        <li className="repeto-profit-breakdown__row">
                            <span className="repeto-profit-breakdown__row-label">
                                <span className="repeto-profit-breakdown__dot repeto-profit-breakdown__dot--received" />
                                Получено
                            </span>
                            <span className="repeto-profit-breakdown__row-amount">
                                {formatRub(received)}
                            </span>
                        </li>
                        <li className="repeto-profit-breakdown__row">
                            <span className="repeto-profit-breakdown__row-label">
                                <span className="repeto-profit-breakdown__dot repeto-profit-breakdown__dot--expected" />
                                Запланировано
                            </span>
                            <span className="repeto-profit-breakdown__row-amount">
                                {formatRub(expected)}
                            </span>
                        </li>
                    </ul>

                    {total === 0 && (
                        <p className="repeto-profit-breakdown__hint">
                            Данные появятся после первых оплат и запланированных уроков.
                        </p>
                    )}
                </>
            )}
        </Card>
    );
};

export default ProfitBreakdown;
