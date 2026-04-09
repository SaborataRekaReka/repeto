import Layout from "@/components/Layout";
import StatCards from "./StatCards";
import IncomeByStudents from "./IncomeByStudents";
import PeriodSummary from "./PeriodSummary";
import BalanceTable from "./BalanceTable";

const FinanceOverviewPage = () => (
    <Layout title="Финансы">
        <StatCards />
        <div className="flex items-stretch -mx-2.5 mt-5 md:block md:mx-0">
            <div className="w-[calc(50%-1.25rem)] mx-2.5 md:w-full md:mx-0 md:mb-5">
                <IncomeByStudents />
            </div>
            <div className="w-[calc(50%-1.25rem)] mx-2.5 md:w-full md:mx-0">
                <PeriodSummary />
            </div>
        </div>
        <BalanceTable />
    </Layout>
);

export default FinanceOverviewPage;
