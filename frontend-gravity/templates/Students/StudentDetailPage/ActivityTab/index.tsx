import { Icon } from "@gravity-ui/uikit";
import { Calendar, CreditCard, FileText, Thunderbolt } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

type ActivityTone = "lesson" | "payment" | "homework" | "note";

export type StudentActivityItem = {
    id: string;
    tone: ActivityTone;
    timestamp: number;
    title: string;
    meta?: string;
    amount?: string;
};

type ActivityTabProps = {
    items: StudentActivityItem[];
};

const GIcon = Icon as any;

const activityIconByTone: Record<ActivityTone, IconData> = {
    lesson: Calendar as IconData,
    payment: CreditCard as IconData,
    homework: FileText as IconData,
    note: Thunderbolt as IconData,
};

const formatActivityDate = (timestamp: number) => {
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
        return { date: "—", time: "" };
    }

    const date = new Date(timestamp);
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;

    return {
        date: date.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
        }),
        time: hasTime
            ? date.toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : "",
    };
};

const ActivityTab = ({ items }: ActivityTabProps) => {
    const sortedItems = [...items].sort((first, second) => second.timestamp - first.timestamp);

    return (
        <div className="tab-section student-activity-tab">
            {sortedItems.length === 0 ? (
                <div className="lp2-empty">Истории пока нет</div>
            ) : (
                <section className="student-ledger-section">
                    <div className="student-ledger-section__head">
                        <div>
                            <div className="student-ledger-section__title">История</div>
                            <div className="student-ledger-section__subtitle">Занятия, оплаты, домашка и заметки</div>
                        </div>
                    </div>

                    <div className="student-ledger-list">
                        {sortedItems.map((item) => {
                            const formatted = formatActivityDate(item.timestamp);
                            const subtitle = [formatted.date, formatted.time, item.meta]
                                .filter(Boolean)
                                .join(" · ");

                            return (
                                <div key={item.id} className="student-ledger-row">
                                    <span className="student-ledger-row__icon">
                                        <GIcon data={activityIconByTone[item.tone]} size={18} />
                                    </span>
                                    <div className="student-ledger-row__copy">
                                        <div className="student-ledger-row__title">{item.title}</div>
                                        {subtitle && <div className="student-ledger-row__subtitle">{subtitle}</div>}
                                    </div>
                                    {item.amount && (
                                        <div className="student-ledger-row__amount">{item.amount}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ActivityTab;
