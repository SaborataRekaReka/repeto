import { useConversion } from "@/hooks/useDashboard";

const ConversionRate = () => {
    const { data, loading } = useConversion();

    const normalizedPct = Math.max(0, Math.round(data?.conversionPct ?? 0));
    const progressPct = Math.min(normalizedPct, 100);

    const earned = data?.earned ?? 0;
    const paid = data?.paid ?? 0;
    const balance = paid - earned;

    return (
        <div className="card">
            <div className="card-head">
                <div className="text-h6">Конверсия в оплату</div>
            </div>
            <div className="p-5">
                {loading ? (
                    <div className="py-4 text-center text-n-3">
                        Загрузка...
                    </div>
                ) : (
                    <>
                        <div className="flex items-end justify-between mb-1">
                            <div className="text-h1 leading-none">
                                {normalizedPct}
                                <span className="text-h4 text-n-3 dark:text-white/50">
                                    %
                                </span>
                            </div>
                            {balance !== 0 && (
                                <div className="text-xs font-bold text-n-3 dark:text-white/50 pb-1">
                                    {balance > 0 ? "+" : "−"}
                                    {Math.abs(balance).toLocaleString("ru-RU")}{" "}
                                    ₽
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-n-3 dark:text-white/50 mb-4">
                            оплачено от заработанного
                        </div>

                        <div className="h-2 bg-n-4/30 dark:bg-white/10 overflow-hidden mb-5">
                            <div
                                className="h-full bg-green-1 transition-all"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>

                        <div className="flex gap-5">
                            <div>
                                <div className="text-xs text-n-3 dark:text-white/50 mb-0.5">
                                    Проведено
                                </div>
                                <div className="text-sm font-bold">
                                    {data?.completedLessons ?? 0} зан.
                                </div>
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {earned.toLocaleString("ru-RU")} ₽
                                </div>
                            </div>
                            <div className="w-px bg-n-4/50 dark:bg-white/10 self-stretch" />
                            <div>
                                <div className="text-xs text-n-3 dark:text-white/50 mb-0.5">
                                    Оплачено
                                </div>
                                <div className="text-sm font-bold">
                                    {data?.paymentsCount ?? 0} плат.
                                </div>
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    {paid.toLocaleString("ru-RU")} ₽
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConversionRate;
