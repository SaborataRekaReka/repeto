import Icon from "@/components/Icon";

const list = [
    {
        title: "Price Change",
        value: "$3,470.81",
    },
    {
        title: "24h Low",
        value: "$32,140.95",
    },
    {
        title: "24h High",
        value: "$36,840.99",
    },
    {
        title: "Market Dominance",
        value: "42.66% ",
    },
    {
        title: "Market Rank",
        value: "#1",
    },
];

type PriceStatisticsProps = {};

const PriceStatistics = ({}: PriceStatisticsProps) => (
    <div className="card">
        <div className="card-title">Price Statistics</div>
        <div className="px-5 py-6">
            <div>
                {list.map((item, index) => (
                    <div
                        className="flex justify-between items-center mt-3.5 pt-3.5 border-t border-dashed border-n-1 first:mt-0 first:pt-0 first:border-none text-sm dark:border-white"
                        key={index}
                    >
                        <div className="font-medium text-n-3 dark:text-white/75">
                            {item.title}
                        </div>
                        <div className="font-bold">{item.value}</div>
                    </div>
                ))}
            </div>
            <button className="btn-stroke btn-small w-full mt-8">
                <Icon name="chart-fill" />
                <span>See more details</span>
            </button>
        </div>
    </div>
);

export default PriceStatistics;
