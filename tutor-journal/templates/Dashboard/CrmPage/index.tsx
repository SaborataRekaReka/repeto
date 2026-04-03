import Layout from "@/components/Layout";
import Statistics from "./Statistics";
import SalesOverview from "./SalesOverview";
import Customers from "./Customers";

const CrmPage = () => {
    return (
        <Layout title="Dashboard">
            <div className="flex -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <Statistics />
                    <SalesOverview />
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <Customers />
                </div>
            </div>
        </Layout>
    );
};

export default CrmPage;
