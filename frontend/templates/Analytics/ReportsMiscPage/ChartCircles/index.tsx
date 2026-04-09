type ChartCirclesProps = {
    items: any;
};

const ChartCircles = ({ items }: ChartCirclesProps) => {
    return (
        <div className="pt-6 px-5 pb-8 lg:pt-8 md:pt-5 md:pb-5">
            <div className="relative w-[18rem] h-[18rem] flex flex-col justify-center items-center mx-auto mb-7">
                {items.map((item: any, index: number) => (
                    <div
                        className="absolute rounded-full"
                        key={index}
                        style={{
                            top: index * 16,
                            left: index * 16,
                            right: index * 16,
                            bottom: index * 16,
                            borderWidth: 4,
                            borderStyle: "solid",
                            borderColor: item.color,
                        }}
                    ></div>
                ))}
                <div className="text-h3">$80,720.50</div>
                <div className="text-sm font-medium">from all accounts</div>
            </div>
            <div className="flex flex-wrap justify-center -mt-1.5 -mx-5 pb-0.25 2xl:-mx-2 md:-mt-4">
                {items.map((item: any, index: number) => (
                    <div
                        className="flex items-center mt-3 mx-5 text-xs font-bold 2xl:mx-2"
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
        </div>
    );
};

export default ChartCircles;
