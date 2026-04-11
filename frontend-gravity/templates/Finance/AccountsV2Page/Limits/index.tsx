import Icon from "@/components/Icon";

type LimitsProps = {
    items: any;
};

const Limits = ({ items }: LimitsProps) => (
    <div className="card">
        <div className="card-title">Your limits</div>
        <div>
            {items.map((item: any) => (
                <div
                    className="px-5 py-5.5 border-b border-n-1 last:border-none dark:border-white"
                    key={item.id}
                >
                    <div className="mb-5 text-h6 md:mb-4">{item.title}</div>
                    <div
                        className="relative h-1 mb-6 bg-green-1 md:mb-4"
                        style={{ backgroundColor: item.percentColor }}
                    >
                        <div
                            className="absolute top-0 left-0 bottom-0 bg-n-1/30"
                            style={{ width: item.percentValue + "%" }}
                        ></div>
                    </div>
                    <div className="flex justify-between">
                        <div>
                            <div className="text-sm font-bold">
                                {item.spent}
                            </div>
                            <div className="text-xs text-n-3 dark:text-white/75">
                                Spent
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold">{item.left}</div>
                            <div className="text-xs text-n-3 dark:text-white/75">
                                Spent
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="pt-2 px-5 pb-6">
            <div className="btn-purple btn-small w-full">
                <Icon name="setup" />
                <span>Setup limits</span>
            </div>
        </div>
    </div>
);

export default Limits;
