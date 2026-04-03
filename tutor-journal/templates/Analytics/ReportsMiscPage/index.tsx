import Layout from "@/components/Layout";
import CardChart from "@/components/CardChart";
import Map from "./Map";
import ChartCircles from "./ChartCircles";
import ChartPie from "./ChartPie";

const list = [
    {
        title: "Purple tag",
        color: "#AE7AFF",
    },
    {
        title: "Green tag",
        color: "#98E9AB",
    },
    {
        title: "Yellow tag",
        color: "#FAE8A4",
    },
];

const ReportsChartWavePage = ({}: any) => {
    return (
        <Layout title="Reports">
            <CardChart className="mb-5" title="Map 12 columns">
                <Map />
            </CardChart>
            <div className="flex -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(50%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <CardChart title="Pie chart 6 columns">
                        <ChartCircles items={list} />
                    </CardChart>
                </div>
                <div className="w-[calc(50%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <CardChart title="Pie chart 6 columns">
                        <ChartPie />
                    </CardChart>
                </div>
            </div>
        </Layout>
    );
};

export default ReportsChartWavePage;
