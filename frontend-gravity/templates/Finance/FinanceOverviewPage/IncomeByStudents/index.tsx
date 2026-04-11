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

const barColors = [
    "var(--g-color-base-brand)",
    "#2ca84a",
    "#c9a225",
    "#d14343",
    "var(--g-color-base-generic-medium)",
];

const VISIBLE_STUDENTS_COUNT = 3;
const STUDENT_ROW_HEIGHT = 64;

const IncomeByStudents = () => {
    const [period, setPeriod] = useState("month");
    const { data: students = [], loading } = useIncomeByStudents(
        period as "month" | "quarter" | "year"
    );
    const router = useRouter();

    const maxTotal = students.length > 0 ? students[0].total : 1;
    const grandTotal = students.reduce((s, st) => s + st.total, 0);
    const visibleRows = Math.min(students.length, VISIBLE_STUDENTS_COUNT);

    return (
        <Card view="outlined" style={{ background: "var(--g-color-base-float)", display: "flex", flexDirection: "column", height: "100%" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--g-color-line-generic)",
                }}
            >
                <Text variant="subheader-2">Доход по ученикам</Text>
                <SegmentedRadioGroup
                    size="s"
                    value={period}
                    onUpdate={setPeriod}
                    options={periodOptions}
                />
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
                            className="repeto-income-students-scroll"
                            style={{
                                height: visibleRows * STUDENT_ROW_HEIGHT,
                                overflowY: students.length > VISIBLE_STUDENTS_COUNT ? "auto" : "hidden",
                                overflowX: "hidden",
                            }}
                        >
                            {students.map((s, i) => {
                                const pct = grandTotal > 0 ? Math.round((s.total / grandTotal) * 100) : 0;
                                const isLastVisible = i === visibleRows - 1;
                                return (
                                    <div
                                        key={s.studentId}
                                        onClick={() => router.push(`/students/${s.studentId}`)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "10px 20px",
                                            minHeight: STUDENT_ROW_HEIGHT,
                                            borderBottom: isLastVisible ? "none" : "1px dashed var(--g-color-line-generic)",
                                            cursor: "pointer",
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <Text variant="caption-2" color="secondary" style={{ width: 20, flexShrink: 0, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                                            {i + 1}
                                        </Text>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                                                <Text variant="body-1" ellipsis style={{ fontWeight: 600 }}>
                                                    {s.studentName}
                                                </Text>
                                                <Text variant="body-1" style={{ flexShrink: 0, marginLeft: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                                                    {s.total.toLocaleString("ru-RU")} ₽
                                                </Text>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ flex: 1, height: 4, background: "var(--g-color-base-generic)", borderRadius: 2, overflow: "hidden" }}>
                                                    <div
                                                        style={{
                                                            height: "100%",
                                                            borderRadius: 2,
                                                            background: barColors[i] || barColors[4],
                                                            width: `${(s.total / maxTotal) * 100}%`,
                                                            transition: "width 0.3s",
                                                        }}
                                                    />
                                                </div>
                                                <Text variant="caption-2" color="secondary" style={{ flexShrink: 0, width: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
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
