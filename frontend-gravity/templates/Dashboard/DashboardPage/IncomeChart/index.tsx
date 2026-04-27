import Link from "next/link";
import { useMemo } from "react";
import { Card, Loader, Icon } from "@gravity-ui/uikit";
import { ChevronRight } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useIncomeChart } from "@/hooks/useDashboard";

const MONTH_GENITIVE = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MONTH_NOM = [
    "январь", "февраль", "март", "апрель", "май", "июнь",
    "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

const formatRub = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toLocaleString("ru-RU", {
        minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    })}\u00A0₽`;
};

const niceMax = (value: number) => {
    if (value <= 0) return 100_000;
    const steps = [
        5_000, 10_000, 20_000, 50_000, 100_000, 150_000, 200_000, 250_000,
        350_000, 500_000, 700_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000,
    ];
    for (const s of steps) {
        if (value <= s) return s;
    }
    return Math.ceil(value / 1_000_000) * 1_000_000;
};

const IncomeChart = () => {
    const { data, loading } = useIncomeChart("year");

    const view = useMemo(() => {
        const all = data?.months ?? [];
        const months = all.slice(-6);
        const total = months.reduce((s, m) => s + m.received + m.expected, 0);
        const peak = months.reduce((m, row) => Math.max(m, row.received + row.expected), 0);
        const axisMax = niceMax(peak);
        const firstIdx = months.length ? Number(months[0].key.split("-")[1]) - 1 : 0;
        const lastIdx = months.length
            ? Number(months[months.length - 1].key.split("-")[1]) - 1
            : 0;
        const title = months.length
            ? `Доход с ${MONTH_GENITIVE[firstIdx]} по ${MONTH_NOM[lastIdx]}`
            : "Доход";
        return { months, axisMax, total, title };
    }, [data]);

    return (
        <Card className="repeto-income-card repeto-tochka-income" view="outlined">
            <header className="repeto-tochka-income__header">
                <span className="repeto-tochka-income__title">{view.title}</span>
                <Link
                    href="/finance/payments"
                    className="repeto-card-chevron"
                    aria-label="Все оплаты"
                >
                    <Icon data={ChevronRight as IconData} size={18} />
                </Link>
            </header>

            {loading && !data ? (
                <div className="repeto-tochka-income__loader">
                    <Loader size="s" />
                </div>
            ) : (
                <>
                    <div className="repeto-tochka-income__amount">
                        {formatRub(view.total)}
                    </div>

                    <div className="repeto-tochka-income__chart repeto-tochka-income__chart--compact">
                        <div className="repeto-tochka-income__axis">
                            <span className="repeto-tochka-income__axis-tick">
                                {view.axisMax.toLocaleString("ru-RU")}
                            </span>
                            <span className="repeto-tochka-income__axis-tick">
                                {Math.round(view.axisMax / 2).toLocaleString("ru-RU")}
                            </span>
                            <span className="repeto-tochka-income__axis-tick">0</span>
                        </div>
                        <div className="repeto-tochka-income__plot">
                            <span className="repeto-tochka-income__grid repeto-tochka-income__grid--top" />
                            <span className="repeto-tochka-income__grid repeto-tochka-income__grid--mid" />
                            <span className="repeto-tochka-income__grid repeto-tochka-income__grid--bottom" />
                            <div className="repeto-tochka-income__bars">
                                {view.months.map((m) => {
                                    const total = m.received + m.expected;
                                    const height = view.axisMax
                                        ? (total / view.axisMax) * 100
                                        : 0;
                                    return (
                                        <div
                                            key={m.key}
                                            className={`repeto-tochka-income__col${m.isCurrent ? " repeto-tochka-income__col--current" : ""}`}
                                        >
                                            <div className="repeto-tochka-income__pair">
                                                <span
                                                    className="repeto-tochka-income__bar"
                                                    style={{ height: `${height}%` }}
                                                    title={`${m.label}: ${formatRub(total)}`}
                                                />
                                            </div>
                                            <span className="repeto-tochka-income__col-label">
                                                {m.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
};

export default IncomeChart;
