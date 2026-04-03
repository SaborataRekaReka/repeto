type StatisticsProps = {
    items: any;
};

const Statistics = ({ items }: StatisticsProps) => (
    <div className="flex mb-5 -mx-2.5 lg:block lg:-mt-2.5 lg:mx-0">
        {items.map((item: any) => (
            <div
                className="w-[calc(33.333%-1.25rem)] mx-2.5 px-5 py-4 card lg:w-full lg:mx-0 lg:mt-2.5"
                key={item.id}
            >
                <div className="mb-0.5 text-sm text-n-3 dark:text-white/75">
                    {item.title}
                </div>
                <div className="mb-3 text-h6">${item.price}</div>
                <div
                    className="relative w-full h-1 mb-6 lg:mb-4"
                    style={{ backgroundColor: item.progressColor }}
                >
                    <div
                        className="absolute left-0 top-0 bottom-0 bg-n-1/30"
                        style={{ width: item.progressValue + "%" }}
                    ></div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="">
                        <div className="font-bold">{item.spent}</div>
                        <div className="text-xs">Spent</div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold">{item.left}</div>
                        <div className="text-xs">Left</div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default Statistics;
