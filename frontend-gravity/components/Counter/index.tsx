import Icon from "@/components/Icon";

type CounterProps = {
    className?: string;
    label?: string;
    title: string;
    value: number;
    setValue: any;
};

const Counter = ({
    className,
    label,
    title,
    value,
    setValue,
}: CounterProps) => {
    return (
        <div className={`${className}`}>
            <div className="">
                {label && <div className="mb-3 text-xs font-bold">{label}</div>}
                <div className="flex items-center h-16 p-5 border border-n-1 rounded-sm dark:border-white">
                    <div className="mr-auto text-sm font-bold">{title}</div>
                    <div className="flex items-center shrink-0 ml-4">
                        <button
                            className={`group ${
                                value === 0 && "pointer-events-none opacity-80"
                            }`}
                            onClick={() => setValue(value - 1)}
                        >
                            <Icon
                                className="icon-18 transition-colors group-hover:fill-purple-2 dark:fill-white"
                                name="minus-circle"
                            />
                        </button>
                        <div className="min-w-[2.5rem] text-center text-xs font-bold">
                            {value}
                        </div>
                        <button
                            className="group"
                            onClick={() => setValue(value + 1)}
                        >
                            <Icon
                                className="icon-18 transition-colors group-hover:fill-purple-2 dark:fill-white"
                                name="plus-circle"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Counter;
