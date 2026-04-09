import Icon from "@/components/Icon";

type StatisticsProps = {
    items: any;
};

const Statistics = ({ items }: StatisticsProps) => (
    <div className="flex border-b border-n-1 lg:block dark:border-white">
        {items.map((item: any) => (
            <div
                className="flex-1 px-5 py-4 border-r border-n-1 last:border-none lg:border-r-0 lg:border-b dark:border-white"
                key={item.id}
            >
                <div className="flex justify-between items-center mb-3">
                    <div className="text-sm text-n-3 dark:text-white/75">
                        {item.category}
                    </div>
                    <Icon
                        className="dark:fill-white"
                        name={
                            item.percent > 0
                                ? "arrow-up-right"
                                : "arrow-down-left"
                        }
                    />
                </div>
                <div className="mb-1 text-h5">${item.price}</div>
                <div className="flex justify-between items-center">
                    <div className="text-xs">{item.content}</div>
                    <div
                        className={`min-w-[2.625rem] text-center text-xs font-bold text-n-1 ${
                            item.percent > 0 ? "bg-green-1" : "bg-pink-1"
                        }`}
                    >
                        {item.percent > 0 ? "+" + item.percent : item.percent}%
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default Statistics;
