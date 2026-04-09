import type { StudentPortalData } from "@/types/student-portal";

type PaymentTabProps = {
    data: StudentPortalData;
};

const PaymentTab = ({ data }: PaymentTabProps) => {
    const balanceColor =
        data.balance < 0
            ? "text-pink-1"
            : data.balance > 0
            ? "text-green-1"
            : "text-n-3 dark:text-white/50";

    const packagePercent = data.package
        ? Math.round((data.package.used / data.package.total) * 100)
        : 0;

    return (
        <>
            {/* Balance */}
            <div className="card mb-6">
                <div className="card-head"><div className="text-h6">Баланс</div></div>
                <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-n-3 dark:text-white/50">
                            Текущий баланс
                        </span>
                        <span
                            className={`text-h4 font-bold ${balanceColor}`}
                        >
                            {data.balance.toLocaleString("ru-RU")} ₽
                        </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-n-3 dark:text-white/50">
                            Ставка
                        </span>
                        <span className="text-sm font-bold">
                            {data.ratePerLesson.toLocaleString("ru-RU")} ₽ /
                            занятие
                        </span>
                    </div>
                    {data.package && (
                        <div className="mb-4 p-3 rounded-sm border border-n-1 dark:border-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold">
                                    Пакет
                                </span>
                                <span className="text-xs text-n-3 dark:text-white/50">
                                    {data.package.used}/{data.package.total}{" "}
                                    занятий · до {data.package.validUntil}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-n-4 rounded-full dark:bg-white/10">
                                <div
                                    className={`h-full rounded-full ${
                                        packagePercent > 75
                                            ? "bg-pink-1"
                                            : packagePercent > 50
                                            ? "bg-yellow-1"
                                            : "bg-green-1"
                                    }`}
                                    style={{
                                        width: `${packagePercent}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    {data.balance < 0 && data.paymentUrl && (
                        <a
                            href={data.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-purple btn-shadow w-full h-12 flex items-center justify-center"
                        >
                            Оплатить{" "}
                            {Math.abs(data.balance).toLocaleString("ru-RU")} ₽
                        </a>
                    )}
                    {data.balance < 0 && !data.paymentUrl && (
                        <button className="btn-purple btn-shadow w-full h-12">
                            Оплатить{" "}
                            {Math.abs(data.balance).toLocaleString("ru-RU")} ₽
                        </button>
                    )}
                </div>
            </div>

            {/* Payment history */}
            <div className="card">
                <div className="card-head"><div className="text-h6">История оплат</div></div>
                <div className="p-5">
                    <div className="space-y-2">
                        {data.recentPayments.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between text-sm py-1"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-n-3 dark:text-white/50 whitespace-nowrap shrink-0">
                                        {p.date}
                                    </span>
                                    <span>{p.method}</span>
                                </div>
                                <span className="font-bold text-green-1">
                                    +{p.amount.toLocaleString("ru-RU")} ₽
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentTab;
