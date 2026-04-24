import { useState } from "react";
import Link from "next/link";
import { Card, Text, Button, Icon, Loader } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { Envelope, ChevronRight } from "@gravity-ui/icons";
import RemindModal from "@/components/RemindModal";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";
import StudentAvatar from "@/components/StudentAvatar";
import { useDebts } from "@/hooks/useDashboard";
import {
    formatBalance,
} from "@/mocks/students";

type DebtStudent = {
    id: string;
    name: string;
    accountId?: string | null;
    subject: string;
    balance: number;
    parentEmail?: string | null;
};

const DEBT_COLOR = "var(--finance-debt)";

const DebtList = () => {
    const { data: debtStudents = [], loading } = useDebts();
    const [reminderTarget, setReminderTarget] = useState<DebtStudent | null>(
        null
    );

    return (
        <>
            <Card view="outlined" style={{ overflow: "hidden" }}>
                <div className="repeto-card-header">
                    <Text variant="subheader-2">Задолженности</Text>
                    <Link
                        href="/payments"
                        className="repeto-card-chevron"
                        aria-label="Все задолженности"
                    >
                        <Icon data={ChevronRight as IconData} size={18} />
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
                    <div>
                        {debtStudents.map((student) => (
                            <Link
                                href={`/students/${student.id}`}
                                key={student.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "100%",
                                    textDecoration: "none",
                                }}
                                className="repeto-week-lesson-row"
                            >
                                <StudentAvatar student={{ name: student.name, avatarUrl: undefined }} size="s" />
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    <Text as="div" variant="body-2" ellipsis className="repeto-dashboard-entity-name">
                                        <StudentNameWithBadge
                                            name={student.name}
                                            hasRepetoAccount={Boolean(student.accountId)}
                                            truncate
                                        />
                                    </Text>
                                    <Text as="div" variant="body-1" color="secondary" style={{ marginTop: 2 }}>
                                        {student.subject}
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
                                        variant="body-1"
                                        className="repeto-dashboard-inline-value"
                                        style={{ color: DEBT_COLOR }}
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

            {reminderTarget && (
                <RemindModal
                    visible={!!reminderTarget}
                    onClose={() => setReminderTarget(null)}
                    onSent={() => setReminderTarget(null)}
                    studentId={reminderTarget.id}
                    studentName={reminderTarget.name}
                    hasRepetoAccount={Boolean(reminderTarget.accountId)}
                    hasDebt={true}
                    hasParentEmail={!!reminderTarget.parentEmail}
                    initialType="payment"
                />
            )}
        </>
    );
};

export default DebtList;
