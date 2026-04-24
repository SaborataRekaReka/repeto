import GravityLayout from "@/components/GravityLayout";
import StatCards from "./StatCards";
import IncomeByStudents from "./IncomeByStudents";
import PeriodSummary from "./PeriodSummary";
import RecentPayments from "@/templates/Dashboard/DashboardPage/RecentPayments";

const FinanceOverviewPage = () => (
    <GravityLayout title="Финансы">
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
    </GravityLayout>
);

export default FinanceOverviewPage;
