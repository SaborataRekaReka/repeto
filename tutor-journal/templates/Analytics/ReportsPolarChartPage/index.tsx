import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import CardChart from "@/components/CardChart";
import Card from "./Card";
import ChartPolar from "./ChartPolar";
import Chart from "./Chart";

import { reportsStatistics5, polarChartData, barsData } from "@/mocks/finance";

const ReportsChartWavePage = () => {
    return (
        <Layout title="Reports">
            <div className="flex -mx-2.5 mb-5 lg:block lg:mx-0">
                {reportsStatistics5.map((card) => (
                    <Card item={card} key={card.id} />
                ))}
            </div>
            <div className="flex -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(50%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <CardChart title="Polar chart 6 columns">
                        <ChartPolar items={polarChartData} />
                    </CardChart>
                </div>
                <div className="w-[calc(50%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <CardChart title="Polar chart 6 columns">
                        <Chart items={barsData.slice(3, 9)} />
                    </CardChart>
                </div>
            </div>
        </Layout>
    );
};

export default ReportsChartWavePage;
