import Link from "next/link";
import { Card, Text, Loader, Icon } from "@gravity-ui/uikit";
import { ChevronRight } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useConversion } from "@/hooks/useDashboard";

const formatRub = (value: number) => `${value.toLocaleString("ru-RU")}\u00A0₽`;

const lessonsWord = (n: number) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "занятие";
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "занятия";
    return "занятий";
};

const ConversionRate = () => {
    const { data, loading } = useConversion("month");

    const pct = Math.min(100, Math.max(0, Math.round(data?.conversionPct ?? 0)));
    const earned = data?.earned ?? 0;
    const paid = data?.paid ?? 0;
    const lessons = data?.completedLessons ?? 0;
    const payments = data?.paymentsCount ?? 0;

    const barColor = pct >= 80
        ? "var(--color-status-success-strong)"
        : pct >= 50
            ? "var(--chart-brand-soft)"
            : "var(--color-status-danger-strong)";

    return (
        <Card view="outlined" className="repeto-conversion-card repeto-tochka-summary-card">
            <div className="repeto-tochka-summary-card__header">
                <div className="repeto-tochka-summary-card__titles">
                    <Text className="repeto-tochka-summary-card__title">Конверсия в оплату</Text>
                    <Text className="repeto-tochka-summary-card__subtitle">
                        За месяц: {payments} из {lessons} {lessonsWord(lessons)} оплачено
                    </Text>
                </div>
                <Link
                    href="/finance/payments"
                    className="repeto-card-chevron"
                    aria-label="Все оплаты"
                >
                    <Icon data={ChevronRight as IconData} size={18} />
                </Link>
            </div>

            {loading ? (
                <div className="repeto-tochka-summary-card__loader">
                    <Loader size="s" />
                </div>
            ) : (
                <>
                    <div className="repeto-tochka-summary-card__hero">
                        <span className="repeto-tochka-summary-card__hero-value">
                            {pct}%
                        </span>
                        <span className="repeto-tochka-summary-card__hero-hint">
                            от проведённых
                        </span>
                    </div>

                    <div className="repeto-tochka-summary-card__bar">
                        <div
                            className="repeto-tochka-summary-card__bar-fill"
                            style={{ width: `${pct}%`, background: barColor }}
                        />
                    </div>

                    <dl className="repeto-tochka-summary-card__list">
                        <div className="repeto-tochka-summary-card__list-row">
                            <dt>Проведено</dt>
                            <dd>
                                {formatRub(earned)}
                            </dd>
                        </div>
                        <div className="repeto-tochka-summary-card__list-row">
                            <dt>Оплачено</dt>
                            <dd>
                                {formatRub(paid)}
                            </dd>
                        </div>
                    </dl>
                </>
            )}
        </Card>
    );
};

export default ConversionRate;
