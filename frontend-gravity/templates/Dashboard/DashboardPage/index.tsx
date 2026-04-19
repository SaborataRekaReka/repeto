import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import LessonPanelV2 from "@/components/LessonPanelV2";
import StatCards from "./StatCards";
import TodaySchedule from "./TodaySchedule";
import WeekSchedule from "./WeekSchedule";
import IncomeChart from "./IncomeChart";
import ConversionRate from "./ConversionRate";
import ExpiringPackages from "./ExpiringPackages";
import DebtList from "./DebtList";
import RecentPayments from "./RecentPayments";
import type { Lesson } from "@/types/schedule";
import { useAuth } from "@/contexts/AuthContext";

type PlanId = "start" | "profi" | "center";
type BillingCycle = "month" | "year";

type PendingRenewalPayment = {
    paymentId: string;
    planId: PlanId;
    billingCycle: BillingCycle;
    createdAt: string;
};

const PENDING_RENEWAL_PAYMENT_KEY = "repeto:platform-access:pending-renewal";

function readPendingRenewalPayment(): PendingRenewalPayment | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(PENDING_RENEWAL_PAYMENT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingRenewalPayment;
        if (!parsed?.paymentId || !parsed?.planId || !parsed?.billingCycle) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function writePendingRenewalPayment(payload: PendingRenewalPayment) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(PENDING_RENEWAL_PAYMENT_KEY, JSON.stringify(payload));
    } catch {
        // ignore storage failures
    }
}

function clearPendingRenewalPayment() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(PENDING_RENEWAL_PAYMENT_KEY);
    } catch {
        // ignore storage failures
    }
}

function resolveErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return "Не удалось продлить доступ. Попробуйте еще раз.";
}

const DashboardPage = () => {
    const router = useRouter();
    const {
        user,
        refreshUser,
        startPlatformAccessPayment,
        completePlatformAccessPayment,
    } = useAuth();

    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
    const [renewBusy, setRenewBusy] = useState(false);
    const [renewError, setRenewError] = useState<string | null>(null);
    const [renewInfo, setRenewInfo] = useState<string | null>(null);
    const handledReturnRef = useRef(false);

    const isAccessExpired = user?.platformAccessState === "expired";

    const planId = useMemo<PlanId>(() => {
        const raw = user?.platformAccess?.planId;
        if (raw === "start" || raw === "profi" || raw === "center") {
            return raw;
        }
        return "profi";
    }, [user?.platformAccess?.planId]);

    const billingCycle = useMemo<BillingCycle>(() => {
        const raw = user?.platformAccess?.billingCycle;
        if (raw === "month" || raw === "year") {
            return raw;
        }
        return "month";
    }, [user?.platformAccess?.billingCycle]);

    const expiresAtLabel = useMemo(() => {
        const raw = user?.platformAccess?.expiresAt;
        if (!raw) return "";
        const date = new Date(raw);
        if (!Number.isFinite(date.getTime())) return "";
        return date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }, [user?.platformAccess?.expiresAt]);

    const handleRenew = async () => {
        setRenewBusy(true);
        setRenewError(null);
        setRenewInfo(null);

        try {
            const result = await startPlatformAccessPayment({
                planId,
                billingCycle,
            });

            if (!result.requiresPayment) {
                clearPendingRenewalPayment();
                await refreshUser();
                setRenewInfo("Доступ продлен.");
                return;
            }

            if (!result.paymentId || !result.confirmationUrl) {
                throw new Error("Не удалось подготовить платеж. Попробуйте снова.");
            }

            writePendingRenewalPayment({
                paymentId: result.paymentId,
                planId: result.planId,
                billingCycle: result.billingCycle,
                createdAt: new Date().toISOString(),
            });

            window.location.assign(result.confirmationUrl);
        } catch (error) {
            setRenewError(resolveErrorMessage(error));
        } finally {
            setRenewBusy(false);
        }
    };

    useEffect(() => {
        if (!router.isReady || handledReturnRef.current) {
            return;
        }

        const renewFlag = typeof router.query.renew === "string" ? router.query.renew : null;
        if (renewFlag !== "1") {
            return;
        }

        handledReturnRef.current = true;
        const pending = readPendingRenewalPayment();
        router.replace("/dashboard", undefined, { shallow: true });

        if (!pending) {
            setRenewError("Не нашли данные платежа. Нажмите «Продлить» еще раз.");
            return;
        }

        setRenewBusy(true);
        setRenewError(null);
        setRenewInfo(null);

        completePlatformAccessPayment({ paymentId: pending.paymentId })
            .then(async () => {
                clearPendingRenewalPayment();
                await refreshUser();
                setRenewInfo("Оплата подтверждена. Доступ восстановлен.");
            })
            .catch((error) => {
                setRenewError(resolveErrorMessage(error));
            })
            .finally(() => {
                setRenewBusy(false);
            });
    }, [router, completePlatformAccessPayment, refreshUser]);

    return (
        <GravityLayout title="Дашборд">
            {isAccessExpired && (
                <section className="repeto-platform-access-alert">
                    <div className="repeto-platform-access-alert__content">
                        <h2 className="repeto-platform-access-alert__title">Доступ к платформе закрыт</h2>
                        <p className="repeto-platform-access-alert__text">
                            {expiresAtLabel
                                ? `Срок действия тарифа истек ${expiresAtLabel}. Чтобы снова пользоваться CRM, продлите доступ.`
                                : "Срок действия тарифа истек. Чтобы снова пользоваться CRM, продлите доступ."}
                        </p>
                        {renewError && (
                            <p className="repeto-platform-access-alert__error">{renewError}</p>
                        )}
                        {renewInfo && (
                            <p className="repeto-platform-access-alert__info">{renewInfo}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        className="repeto-platform-access-alert__button"
                        onClick={handleRenew}
                        disabled={renewBusy}
                    >
                        {renewBusy ? "Проверяем оплату..." : "Продлить"}
                    </button>
                </section>
            )}

            {!isAccessExpired && (
                <>
                    <StatCards />
                    <div className="repeto-dashboard-grid">
                        <div className="repeto-dashboard-grid__main">
                            <IncomeChart />
                            <div className="repeto-two-col">
                                <ConversionRate />
                                <ExpiringPackages />
                            </div>
                            <RecentPayments />
                        </div>
                        <div className="repeto-dashboard-grid__aside">
                            <TodaySchedule
                                refreshKey={scheduleRefreshKey}
                                onLessonClick={(lesson) => setSelectedLesson(lesson)}
                            />
                            <WeekSchedule
                                refreshKey={scheduleRefreshKey}
                                onLessonClick={(lesson) => setSelectedLesson(lesson)}
                            />
                            <DebtList />
                        </div>
                    </div>
                    <LessonPanelV2
                        open={!!selectedLesson}
                        onClose={() => setSelectedLesson(null)}
                        lesson={selectedLesson}
                        onSaved={() => setScheduleRefreshKey((value) => value + 1)}
                    />
                </>
            )}
        </GravityLayout>
    );
};

export default DashboardPage;
