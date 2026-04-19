import GravityLayout from "@/components/GravityLayout";
import StatCards from "./StatCards";
import IncomeByStudents from "./IncomeByStudents";
import PeriodSummary from "./PeriodSummary";
import BalanceTable from "./BalanceTable";

const FinanceOverviewPage = () => (
    <GravityLayout title="Финансы">
        <StatCards />
        <div className="repeto-finance-overview-row">
            <div style={{ flex: 1, minWidth: 0 }}>
                <IncomeByStudents />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <PeriodSummary />
            </div>
        </div>
        <BalanceTable />
    </GravityLayout>
);

export default FinanceOverviewPage;
