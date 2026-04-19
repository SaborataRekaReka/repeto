import Link from "next/link";
import { useRouter } from "next/router";
import { Text, Card, Label } from "@gravity-ui/uikit";
import { useStudentBalances } from "@/hooks/usePayments";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";

const BalanceTable = () => {
    const router = useRouter();
    const { data: balancesData, loading } = useStudentBalances();
    const studentBalances = balancesData?.data || [];

    return (
        <Card className="repeto-balance-table-card" view="outlined" style={{ marginTop: 20, background: "var(--g-color-base-float)", overflow: "hidden" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--g-color-line-generic)",
                }}
            >
                <Text variant="subheader-2">Баланс учеников</Text>
                <Link href="/payments" style={{ textDecoration: "none" }}>
                    <Text variant="body-1" color="brand" style={{ fontWeight: 600, cursor: "pointer" }}>
                        Все →
                    </Text>
                </Link>
            </div>
                    <div className="repeto-balance-table-scroll">
                        <table className="repeto-balance-table">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--g-color-line-generic)" }}>
                                    {["Имя", "Занятий", "Сумма", "Оплачено", "Долг"].map((h, i) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: "10px 20px",
                                                textAlign: i === 0 ? "left" : "right",
                                                fontWeight: 500,
                                                fontSize: 13,
                                                color: "var(--g-color-text-secondary)",
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {studentBalances.map((s) => (
                                    <tr
                                        key={s.studentId}
                                        onClick={() => router.push(`/students/${s.studentId}`)}
                                        style={{ cursor: "pointer", borderBottom: "1px solid var(--g-color-line-generic)", transition: "background 0.15s" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-color-base-simple-hover)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: "12px 20px" }}>
                                            <Text variant="body-1" style={{ fontWeight: 600 }}>
                                                <StudentNameWithBadge
                                                    name={s.studentName}
                                                    hasRepetoAccount={Boolean(s.studentAccountId)}
                                                />
                                            </Text>
                                            <Text variant="caption-2" color="secondary" style={{ display: "block" }}>{s.subject}</Text>
                                        </td>
                                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                                            <Text variant="body-1">{s.lessonsCount}</Text>
                                        </td>
                                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                                            <Text variant="body-1" style={{ fontVariantNumeric: "tabular-nums" }}>{s.totalAmount.toLocaleString("ru-RU")} ₽</Text>
                                        </td>
                                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                                            <Text variant="body-1" style={{ fontVariantNumeric: "tabular-nums" }}>{s.paidAmount.toLocaleString("ru-RU")} ₽</Text>
                                        </td>
                                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                                            {s.debt > 0 ? (
                                                <Label theme="danger" size="s">{s.debt.toLocaleString("ru-RU")} ₽</Label>
                                            ) : s.debt < 0 ? (
                                                <Label theme="success" size="s">−{Math.abs(s.debt).toLocaleString("ru-RU")} ₽</Label>
                                            ) : (
                                                <Text variant="body-1" color="secondary">—</Text>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
        </Card>
    );
};

export default BalanceTable;
