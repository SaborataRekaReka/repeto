import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import CardChart from "@/components/CardChart";
import Statistics from "./Statistics";
import Chart from "./Chart";

import { reportsStatistics, barsData } from "@/mocks/finance";

const ReportsBarsPage = () => {
    return (
        <Layout title="Reports">
            <div className="card mb-5">
                <div className="card-head">
                    <div className="text-h6">Bars 12 columns</div>
                    <button className="group text-0">
                        <Icon
                            className="icon-18 fill-n-1 transition-colors dark:fill-white group-hover:fill-purple-1"
                            name="calendar"
                        />
                    </button>
                </div>
                <Statistics items={reportsStatistics} />
                <Chart items={barsData} />
            </div>
            <CardChart title="Bars 12 columns">
                <Chart items={barsData} />
            </CardChart>
            <div className="flex mt-5 -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <CardChart title="Bars 8 columns">
                        <Chart items={barsData.slice(0, 8)} />
                    </CardChart>
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <CardChart title="Bars 4 columns">
                        <Chart items={barsData.slice(8, 12)} />
                    </CardChart>
                </div>
            </div>
        </Layout>
    );
};

export default ReportsBarsPage;
