import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import CardChart from "@/components/CardChart";
import Statistics from "./Statistics";
import Chart from "./Chart";

import { reportsStatistics1, barsDoubleData } from "@/mocks/finance";

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

const ReportsPolarChartPage = () => {
    return (
        <Layout title="Reports">
            <div className="card mb-5">
                <div className="card-head justify-stretch">
                    <div className="mr-auto text-h6">Bars 12 columns</div>
                    <div className="flex items-center mr-6 lg:flex-col lg:items-stretch">
                        {legend.map((item, index) => (
                            <div
                                className="flex items-center mr-6 last:mr-0 text-xs font-bold lg:mr-0"
                                key={index}
                            >
                                <div
                                    className="w-2 h-2 mr-1.5 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                {item.title}
                            </div>
                        ))}
                    </div>
                    <button className="group text-0">
                        <Icon
                            className="icon-18 fill-n-1 transition-colors dark:fill-white group-hover:fill-purple-1"
                            name="calendar"
                        />
                    </button>
                </div>
                <Statistics items={reportsStatistics1} />
                <Chart items={barsDoubleData} />
            </div>
            <CardChart className="mb-5" title="Bars 12 columns">
                <Chart items={barsDoubleData} />
            </CardChart>
            <div className="flex -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <CardChart title="Bars 8 columns">
                        <Chart items={barsDoubleData.slice(0, 8)} />
                    </CardChart>
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <CardChart title="Bars 4 columns">
                        <Chart items={barsDoubleData.slice(8, 12)} />
                    </CardChart>
                </div>
            </div>
        </Layout>
    );
};

export default ReportsPolarChartPage;
