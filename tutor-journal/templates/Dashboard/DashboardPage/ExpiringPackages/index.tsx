import Link from "next/link";
import { useExpiringPackages } from "@/hooks/useDashboard";

const ExpiringPackages = () => {
    const { data: packages = [], loading } = useExpiringPackages();

    return (
        <div className="card">
            <div className="card-head">
                <div className="mr-auto text-h6">Истекающие пакеты</div>
                <Link
                    href="/packages"
                    className="text-xs font-bold transition-colors hover:text-purple-1"
                >
                    Все →
                </Link>
            </div>
            {loading ? (
                <div className="px-5 py-6 text-center text-n-3">
                    Загрузка...
                </div>
            ) : packages.length === 0 ? (
                <div className="px-5 py-6 text-center">
                    <div className="text-xs font-medium text-n-3 dark:text-white/50">
                        Нет пакетов с истекающим сроком
                    </div>
                </div>
            ) : (
                <div className="p-4 space-y-3">
                    {packages.map((pkg) => {
                        const remaining =
                            pkg.lessonsTotal - pkg.lessonsUsed;
                        const pct =
                            pkg.lessonsTotal > 0
                                ? Math.round(
                                      (pkg.lessonsUsed / pkg.lessonsTotal) *
                                          100
                                  )
                                : 0;
                        const urgent = remaining <= 2;

                        return (
                            <div
                                key={pkg.id}
                                className={`border border-n-1 dark:border-white p-3 hover:shadow-primary-4 transition-shadow ${
                                    urgent
                                        ? "border-l-4 border-l-pink-1"
                                        : ""
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold truncate">
                                        {pkg.studentName}
                                    </span>
                                    <span
                                        className={`label text-xs ${
                                            urgent
                                                ? "label-stroke-pink"
                                                : "label-stroke"
                                        }`}
                                    >
                                        до {pkg.validUntil}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-n-3 dark:text-white/50">
                                        {pkg.subject}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold">
                                            {pkg.lessonsUsed}/
                                            {pkg.lessonsTotal}
                                        </span>
                                        <span
                                            className={`text-xs font-bold ${
                                                urgent
                                                    ? "text-pink-1"
                                                    : "text-n-3 dark:text-white/50"
                                            }`}
                                        >
                                            ({remaining} ост.)
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 bg-n-4/40 dark:bg-white/10 overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${
                                            urgent
                                                ? "bg-pink-1"
                                                : "bg-purple-1"
                                        }`}
                                        style={{
                                            width: `${pct}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExpiringPackages;
