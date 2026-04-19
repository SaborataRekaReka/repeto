import { useState } from "react";
import { useRouter } from "next/router";
import { Text, Card } from "@gravity-ui/uikit";
import { SegmentedRadioGroup } from "@gravity-ui/uikit";
import { useIncomeByStudents } from "@/hooks/usePayments";

const periodOptions = [
    { value: "month", content: "Месяц" },
    { value: "quarter", content: "Квартал" },
    { value: "year", content: "Год" },
];

const VISIBLE_STUDENTS_COUNT = 3;
const STUDENT_ROW_HEIGHT = 64;

function getBarColor(index: number): string {
    if (index === 0) {
        return "rgba(174, 122, 255, 1)";
    }
    if (index === 1) {
        return "rgba(174, 122, 255, 0.76)";
    }
    if (index === 2) {
        return "rgba(174, 122, 255, 0.58)";
    }
    return "rgba(174, 122, 255, 0.42)";
}

const IncomeByStudents = () => {
    const [period, setPeriod] = useState("month");
    const { data: students = [], loading } = useIncomeByStudents(
        period as "month" | "quarter" | "year"
    );
    const router = useRouter();

    const maxTotal = students.length > 0 ? students[0].total : 1;
    const grandTotal = students.reduce((s, st) => s + st.total, 0);
    const visibleRows = Math.min(students.length, VISIBLE_STUDENTS_COUNT);
    const hasOverflow = students.length > VISIBLE_STUDENTS_COUNT;

    return (
        <Card className="repeto-income-students-card" view="outlined" style={{ background: "var(--g-color-base-float)", display: "flex", flexDirection: "column", height: "100%" }}>
            <div
                className="repeto-income-students-card__header"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--g-color-line-generic)",
                }}
            >
                <Text variant="subheader-2">Доход по ученикам</Text>
                <div className="repeto-income-students-card__period">
                    <SegmentedRadioGroup
                        size="s"
                        value={period}
                        onUpdate={setPeriod}
                        options={periodOptions}
                    />
                </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {loading ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Text color="secondary">Загрузка...</Text>
                    </div>
                ) : students.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Text variant="body-1" color="secondary">Нет данных за период</Text>
                    </div>
                ) : (
                    <>
                        <div
                            className="repeto-income-students-scroll repeto-income-students-card__scroll"
                            style={{
                                height: visibleRows * STUDENT_ROW_HEIGHT,
                                overflowY: hasOverflow ? "auto" : "hidden",
                                overflowX: "hidden",
                            }}
                        >
                            {students.map((s, i) => {
                                const pct = grandTotal > 0 ? Math.round((s.total / grandTotal) * 100) : 0;
                                const isLastRow = i === students.length - 1;
                                return (
                                    <div
                                        key={s.studentId}
                                        className="repeto-income-students-card__item"
                                        onClick={() => router.push(`/students/${s.studentId}`)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 18px 12px 16px",
                                            minHeight: STUDENT_ROW_HEIGHT,
                                            borderBottom: isLastRow ? "none" : "1px solid rgba(133, 140, 148, 0.16)",
                                            cursor: "pointer",
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <div className="repeto-income-students-card__rank">
                                            {i + 1}
                                        </div>
                                        <div className="repeto-income-students-card__content" style={{ flex: 1, minWidth: 0 }}>
                                            <div className="repeto-income-students-card__row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                                                <Text variant="body-1" ellipsis className="repeto-income-students-card__name" style={{ fontWeight: 600 }}>
                                                    {s.studentName}
                                                </Text>
                                                <Text variant="body-1" className="repeto-income-students-card__amount" style={{ flexShrink: 0, marginLeft: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                                                    {s.total.toLocaleString("ru-RU")} ₽
                                                </Text>
                                            </div>
                                            <div className="repeto-income-students-card__bar-row" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div className="repeto-income-students-card__bar-track" style={{ flex: 1, height: 6, background: "rgba(133, 140, 148, 0.16)", borderRadius: 999, overflow: "hidden" }}>
                                                    <div
                                                        className="repeto-income-students-card__bar-fill"
                                                        style={{
                                                            height: "100%",
                                                            borderRadius: 999,
                                                            background: getBarColor(i),
                                                            width: `${(s.total / maxTotal) * 100}%`,
                                                            transition: "width 0.3s",
                                                        }}
                                                    />
                                                </div>
                                                <Text variant="caption-2" color="secondary" className="repeto-income-students-card__share" style={{ flexShrink: 0, width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                                    {pct}%
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};

export default IncomeByStudents;
