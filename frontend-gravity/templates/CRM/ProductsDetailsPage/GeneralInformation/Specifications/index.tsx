import Icon from "@/components/Icon";

type SpecificationsProps = {
    items: any;
};

const Specifications = ({ items }: SpecificationsProps) => (
    <div className="mb-6">
        <div className="mb-4 text-xs font-bold">Specifications</div>
        <div className="p-5 border border-n-1 rounded-sm md:p-3 dark:border-white">
            <div className="flex flex-wrap -mt-1.5 -mx-0.75">
                {items.map((specification: any, index: number) => (
                    <div
                        className="inline-flex items-center label-stroke mt-1.5 mx-0.75 text-xs font-bold"
                        key={index}
                    >
                        <button className="group mr-1">
                            <Icon
                                className="transition-colors dark:fill-white group-hover:fill-pink-1"
                                name="close"
                            />
                        </button>
                        {specification}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default Specifications;
