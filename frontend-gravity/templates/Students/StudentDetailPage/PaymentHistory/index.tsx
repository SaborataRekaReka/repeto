import { Icon } from "@gravity-ui/uikit";
import { Calendar, ChevronRight, CreditCard } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { Payment } from "@/types/finance";
import type { Lesson } from "@/types/schedule";
import { getMethodLabel } from "@/mocks/finance-tutor";
import TabAddSlot from "../TabAddSlot";

const GIcon = Icon as any;

type PaymentHistoryProps = {
    payments: Payment[];
    lessons?: Lesson[];
    balance?: number;
    onAdd?: (lesson?: Lesson) => void;
};

type LedgerOperation = {
    id: string;
    kind: "payment" | "lesson";
    title: string;
    subtitle: string;
    amount: number;
    direction: "credit" | "debit";
    timestamp: number;
};

const formatMoney = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;
const formatAbsoluteMoney = (value: number) => `${Math.abs(value).toLocaleString("ru-RU")} ₽`;

const parseDateTimestamp = (value: string, time = "00:00") => {
    const raw = String(value || "").trim();
    if (!raw) return 0;

    const ru = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ru) {
        const parsed = new Date(`${ru[3]}-${ru[2]}-${ru[1]}T${time}`).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const isoDate = raw.match(/^\d{4}-\d{2}-\d{2}$/);
    const parsed = new Date(isoDate ? `${raw}T${time}` : raw).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value: string) => {
    const timestamp = parseDateTimestamp(value);
    if (!timestamp) return value;

    return new Date(timestamp).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const buildOperations = (payments: Payment[], completedLessons: Lesson[]): LedgerOperation[] => {
    const paymentOperations = payments.map((payment) => ({
        id: `payment-${payment.id}`,
        kind: "payment" as const,
        title: `Оплата · ${getMethodLabel(payment.method)}`,
        subtitle: [payment.date, payment.comment].filter(Boolean).join(" · "),
        amount: payment.amount,
        direction: "credit" as const,
        timestamp: parseDateTimestamp(payment.date),
    }));

    const lessonOperations = completedLessons.map((lesson) => ({
        id: `lesson-${lesson.id}`,
        kind: "lesson" as const,
        title: `Занятие · ${lesson.subject}`,
        subtitle: [formatDate(lesson.date), lesson.startTime].filter(Boolean).join(" · "),
        amount: lesson.rate,
        direction: "debit" as const,
        timestamp: parseDateTimestamp(lesson.date, lesson.startTime),
    }));

    return [...paymentOperations, ...lessonOperations]
        .sort((first, second) => second.timestamp - first.timestamp);
};

const PaymentHistory = ({ payments, lessons = [], balance, onAdd }: PaymentHistoryProps) => {
    const paidTotal = payments
        .filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + payment.amount, 0);
    const completedLessons = lessons.filter((lesson) => lesson.status === "completed");
    const lessonEarnedTotal = completedLessons.reduce((sum, lesson) => sum + lesson.rate, 0);
    const linkedLessonIds = new Set(payments.map((payment) => payment.lessonId).filter(Boolean));
    const unpaidLessons = completedLessons
        .filter((lesson) => !linkedLessonIds.has(lesson.id))
        .sort((first, second) => parseDateTimestamp(second.date, second.startTime) - parseDateTimestamp(first.date, first.startTime));
    const balanceValue = typeof balance === "number" ? balance : paidTotal - lessonEarnedTotal;
    const earnedTotal = typeof balance === "number" ? paidTotal - balance : lessonEarnedTotal;
    const operations = buildOperations(payments, completedLessons);
    const balanceCaption = balanceValue < 0 ? "К оплате" : balanceValue > 0 ? "На балансе" : "Баланс";

    return (
        <div className="tab-section student-payment-tab">
            <div className="student-payment-ledger">
                <section className="student-payment-hero">
                    <div className="student-payment-hero__caption">{balanceCaption}</div>
                    <div className="student-payment-hero__amount">{formatMoney(balanceValue)}</div>
                    <div className="student-payment-hero__metrics">
                        <span>Оплачено {formatMoney(paidTotal)}</span>
                        <span>Начислено {formatMoney(earnedTotal)}</span>
                        <span>Без оплаты {unpaidLessons.length}</span>
                    </div>
                </section>

                {unpaidLessons.length > 0 && (
                    <section className="student-ledger-section">
                        <div className="student-ledger-section__head">
                            <div>
                                <div className="student-ledger-section__title">Неоплаченные занятия</div>
                                <div className="student-ledger-section__subtitle">Можно быстро привязать оплату к занятию</div>
                            </div>
                        </div>
                        <div className="student-payment-due-list">
                            {unpaidLessons.slice(0, 6).map((lesson) => (
                                <div key={lesson.id} className="student-payment-due-row">
                                    <div className="student-payment-due-row__copy">
                                        <span>{lesson.subject}</span>
                                        <span>{formatDate(lesson.date)} · {lesson.startTime}</span>
                                    </div>
                                    <div className="student-payment-due-row__amount">{formatMoney(lesson.rate)}</div>
                                    {onAdd && (
                                        <button
                                            type="button"
                                            className="student-payment-due-row__action"
                                            onClick={() => onAdd(lesson)}
                                        >
                                            Записать
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="student-ledger-section">
                    <div className="student-ledger-section__head">
                        <div>
                            <div className="student-ledger-section__title">Операции</div>
                            <div className="student-ledger-section__subtitle">Оплаты и проведенные занятия в одной ленте</div>
                        </div>
                        <GIcon data={ChevronRight as IconData} size={18} />
                    </div>

                    {operations.length === 0 ? (
                        <div className="lp2-empty lp2-empty--with-action">
                            <span>Операций пока нет</span>
                            {onAdd && <TabAddSlot title="Добавить оплату" onClick={() => onAdd()} />}
                        </div>
                    ) : (
                        <div className="student-ledger-list">
                            {operations.map((operation) => (
                                <div key={operation.id} className="student-ledger-row">
                                    <span className="student-ledger-row__icon">
                                        <GIcon
                                            data={(operation.kind === "payment" ? CreditCard : Calendar) as IconData}
                                            size={18}
                                        />
                                    </span>
                                    <div className="student-ledger-row__copy">
                                        <div className="student-ledger-row__title">{operation.title}</div>
                                        <div className="student-ledger-row__subtitle">{operation.subtitle}</div>
                                    </div>
                                    <div className={`student-ledger-row__amount student-ledger-row__amount--${operation.direction}`}>
                                        {operation.direction === "credit" ? "+" : "−"}{formatAbsoluteMoney(operation.amount)}
                                    </div>
                                </div>
                            ))}
                            {onAdd && <TabAddSlot title="Добавить оплату" onClick={() => onAdd()} />}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default PaymentHistory;
