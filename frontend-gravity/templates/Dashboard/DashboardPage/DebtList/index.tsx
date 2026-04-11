import { useState } from "react";
import Link from "next/link";
import { Card, Text, Button, Icon, Modal, Loader } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { Envelope, CircleCheck } from "@gravity-ui/icons";
import { useDebts } from "@/hooks/useDashboard";
import {
    formatBalance,
    getInitials,
} from "@/mocks/students";

type DebtStudent = {
    id: string;
    name: string;
    subject: string;
    balance: number;
};

const avatarGradients = [
    "linear-gradient(135deg, #AE7AFF, #7030D9)",
    "linear-gradient(135deg, #98E9AB, #65C88E)",
    "linear-gradient(135deg, #C6A6FF, #8E7BFF)",
    "linear-gradient(135deg, #73D8A8, #45B886)",
    "linear-gradient(135deg, #AE7AFF, #8E7BFF)",
];

const DEBT_COLOR = "#D16B8F";
const DEBT_BG = "rgba(209,107,143,0.12)";

const DebtList = () => {
    const { data: debtStudents = [], loading } = useDebts();
    const [reminderTarget, setReminderTarget] = useState<DebtStudent | null>(
        null
    );
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        setSent(true);
        setTimeout(() => {
            setReminderTarget(null);
            setSent(false);
        }, 1500);
    };

    return (
        <>
            <Card view="outlined" style={{ overflow: "hidden" }}>
                <div className="repeto-card-header">
                    <Text variant="subheader-2">Задолженности</Text>
                    <Link
                        href="/payments"
                        style={{
                            fontSize: 13,
                            color: "var(--g-color-text-brand)",
                            textDecoration: "none",
                        }}
                    >
                        Все →
                    </Link>
                </div>
                {loading ? (
                    <div style={{ padding: "32px 0", textAlign: "center" }}>
                        <Loader size="s" />
                    </div>
                ) : debtStudents.length === 0 ? (
                    <div style={{ padding: "32px 20px", textAlign: "center" }}>
                        <Text variant="body-1" color="secondary">
                            Задолженностей нет
                        </Text>
                    </div>
                ) : (
                    <div style={{ padding: "4px 12px 12px" }}>
                        {debtStudents.map((student, idx) => (
                            <Link
                                href={`/students/${student.id}`}
                                key={student.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "10px 12px",
                                    marginTop: 4,
                                    textDecoration: "none",
                                    borderRadius: 12,
                                    background: DEBT_BG,
                                    borderLeft: `3px solid ${DEBT_COLOR}`,
                                    transition: "background 0.15s",
                                }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background:
                                            avatarGradients[
                                                idx % avatarGradients.length
                                            ],
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}
                                >
                                    {getInitials(student.name)}
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        padding: "0 12px",
                                        minWidth: 0,
                                    }}
                                >
                                    <Text variant="body-2" ellipsis>
                                        {student.name}
                                    </Text>
                                    <Text variant="body-1" color="secondary">
                                        style={{ color: DEBT_COLOR }}
                                    </Text>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Text
                                        variant="body-2"
                                        style={{ color: "#D16B8F" }}
                                    >
                                        {formatBalance(student.balance)}
                                    </Text>
                                    <Button
                                        view="flat"
                                        size="s"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setReminderTarget(student);
                                        }}
                                    >
                                        <Icon data={Envelope as IconData as IconData} size={16} />
                                    </Button>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Card>

            <Modal open={!!reminderTarget} onClose={() => {
                setReminderTarget(null);
                setSent(false);
            }}>
                <div style={{ padding: 32, textAlign: "center", minWidth: 360, borderRadius: 20 }}>
                    {reminderTarget && !sent && (
                        <>
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 12,
                                    background: DEBT_BG,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                }}
                            >
                                <Icon
                                    data={Envelope}
                                    size={24}
                                    style={{ color: DEBT_COLOR }}
                                />
                            </div>
                            <Text
                                variant="header-1"
                                style={{ marginBottom: 8 }}
                            >
                                Напомнить об оплате
                            </Text>
                            <Text variant="body-1" color="secondary">
                                {reminderTarget.name} · {reminderTarget.subject}
                            </Text>
                            <Text
                                variant="body-2"
                                style={{
                                    color: DEBT_COLOR,
                                    margin: "4px 0 24px",
                                }}
                            >
                                Задолженность:{" "}
                                {formatBalance(reminderTarget.balance)}
                            </Text>
                            <Text
                                variant="body-1"
                                color="secondary"
                                style={{ marginBottom: 24 }}
                            >
                                Ученику будет отправлено уведомление с просьбой
                                погасить задолженность.
                            </Text>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                }}
                            >
                                <Button
                                    view="outlined"
                                    size="l"
                                    width="max"
                                    onClick={() => setReminderTarget(null)}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    view="action"
                                    size="l"
                                    width="max"
                                    onClick={handleSend}
                                >
                                    <Icon data={Envelope} size={16} />
                                    Отправить
                                </Button>
                            </div>
                        </>
                    )}
                    {reminderTarget && sent && (
                        <>
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 12,
                                    background: "rgba(34,197,94,0.12)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                }}
                            >
                                <Icon
                                    data={CircleCheck}
                                    size={24}
                                    style={{ color: "#22C55E" }}
                                />
                            </div>
                            <Text
                                variant="header-1"
                                style={{ marginBottom: 8 }}
                            >
                                Напоминание отправлено
                            </Text>
                            <Text variant="body-1" color="secondary">
                                {reminderTarget.name} получит уведомление.
                            </Text>
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default DebtList;
