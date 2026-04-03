import Layout from "@/components/Layout";
import StatCards from "./StatCards";
import IncomeChart from "./IncomeChart";
import PaymentMethods from "./PaymentMethods";
import BalanceTable from "./BalanceTable";

const FinanceOverviewPage = () => (
    <Layout title="Финансы">
        <StatCards />
        <div className="flex -mx-2.5 lg:block lg:mx-0">
            <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                <IncomeChart />
            </div>
            <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                <PaymentMethods />
            </div>
        </div>
        <BalanceTable />
    </Layout>
);

export default FinanceOverviewPage;
