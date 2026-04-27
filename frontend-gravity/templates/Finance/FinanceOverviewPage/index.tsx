import { useCallback } from "react";
import { useRouter } from "next/router";
import GravityLayout from "@/components/GravityLayout";
import PageOverlay from "@/components/PageOverlay";
import StatCards from "./StatCards";
import IncomeByStudents from "./IncomeByStudents";
import PeriodSummary from "./PeriodSummary";
import RecentPayments from "@/templates/Dashboard/DashboardPage/RecentPayments";
import FinanceSidebarTools, { financeSectionNav } from "@/templates/Finance/FinanceSidebarTools";

const FinanceOverviewPage = () => {
    const router = useRouter();

    const handleSectionChange = useCallback((key: string) => {
        if (key === "payments") {
            void router.push("/finance/payments");
            return;
        }
        void router.push("/finance");
    }, [router]);

    return (
        <GravityLayout title="Финансы">
            <PageOverlay
                title="Финансы"
                breadcrumb="Дашборд"
                backHref="/dashboard"
                nav={financeSectionNav}
                activeNav="overview"
                onNavChange={handleSectionChange}
                sidebarHeader={
                    <FinanceSidebarTools
                        onOpenDebtors={() => {
                            void router.push("/students?filter=debt");
                        }}
                    />
                }
            >
                <div className="repeto-tochka-dash">
                    <div className="repeto-tochka-finance">
                        <StatCards />
                        <div className="repeto-two-col">
                            <IncomeByStudents />
                            <PeriodSummary />
                        </div>
                        <RecentPayments />
                    </div>
                </div>
            </PageOverlay>
        </GravityLayout>
    );
};

export default FinanceOverviewPage;
