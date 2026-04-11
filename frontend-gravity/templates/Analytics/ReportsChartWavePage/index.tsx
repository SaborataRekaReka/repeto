import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import CardChart from "@/components/CardChart";
import Statistics from "./Statistics";
import Chart from "./Chart";

import { reportsStatistics3, barsDoubleData } from "@/mocks/finance";

const legend = [
    {
        title: "Purple Tag",
        color: "#AE7AFF",
    },
    {
        title: "Green Tag",
        color: "#98E9AB",
    },
];

const ReportsChartWavePage = () => {
    return (
        <Layout title="Reports">
            <Statistics items={reportsStatistics3} />
            <CardChart className="mb-5" title="Wave 12 columns" legend={legend}>
                <Chart items={barsDoubleData} />
            </CardChart>
            <div className="flex -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <CardChart title="Wave 8 columns" legend={legend}>
                        <Chart items={barsDoubleData.slice(4, 12)} />
                    </CardChart>
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <CardChart title="Wave 4 columns">
                        <Chart items={barsDoubleData.slice(0, 4)} />
                    </CardChart>
                </div>
            </div>
        </Layout>
    );
};

export default ReportsChartWavePage;
