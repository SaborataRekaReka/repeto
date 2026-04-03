import Icon from "@/components/Icon";

type CardChartProps = {
    className?: string;
    title: string;
    legend?: any;
    children: React.ReactNode;
};

const CardChart = ({ className, title, legend, children }: CardChartProps) => (
    <div className={`card ${className}`}>
        <div className="card-head justify-stretch">
            <div className="mr-auto text-h6">{title}</div>
            {legend && (
                <div className="flex items-center mr-6 md:flex-col md:items-stretch">
                    {legend.map((item: any, index: number) => (
                        <div
                            className="flex items-center mr-6 last:mr-0 text-xs font-bold md:mr-0"
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
            )}
            <button className="group text-0">
                <Icon
                    className="icon-18 fill-n-1 transition-colors dark:fill-white group-hover:fill-purple-1"
                    name="calendar"
                />
            </button>
        </div>
        {children}
    </div>
);

export default CardChart;
