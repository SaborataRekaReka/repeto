import Image from "@/components/Image";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => (
    <div className="p-4 border-b border-n-1 last:border-none dark:border-white">
        <div className="flex justify-between items-center mb-3">
            <div className="font-bold text-xs">{item.date}</div>
            <div className="label-green min-w-[4.6rem] lg:h-5">
                {item.status}
            </div>
        </div>
        <div className="flex items-center text-sm">
            <div className="w-15 border border-n-1">
                <Image
                    className="w-full"
                    src={item.image}
                    width={60}
                    height={48}
                    alt=""
                />
            </div>
            <div className="grow pl-3">
                <div className="flex justify-between items-center mb-1 font-bold">
                    <div className="">{item.title}</div>
                    <div className="">${item.amount}</div>
                </div>
                <div className="flex justify-between items-center font-medium text-n-3 dark:text-white/75">
                    <div className="">Order #: {item.order}</div>
                    <div className="">Tax: ${item.tax}</div>
                </div>
            </div>
        </div>
    </div>
);

export default Item;
