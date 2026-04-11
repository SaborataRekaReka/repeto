import Link from "next/link";
import Image from "@/components/Image";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => (
    <Link
        className="flex justify-between items-center px-4 py-3 border-b border-n-1 text-sm last:border-none dark:border-white"
        href="/crm/product-details"
    >
        <div className="">
            <div className="mb-3 text-xs">{item.date}</div>
            <div className="inline-flex items-center">
                <div className="w-15 mr-3 border border-n-1">
                    <Image
                        className="w-full"
                        src={item.image}
                        width={60}
                        height={42}
                        alt=""
                    />
                </div>
                <div className="">
                    <div className="font-bold">{item.title}</div>
                    <div>{item.color}</div>
                </div>
            </div>
        </div>
        <div className="text-right">
            <div className="label-green min-w-[3.75rem] h-4.5 mb-3">
                {item.avl}
            </div>
            <div className="">
                <div className="font-bold">{item.price}</div>
                <div>{item.sales}</div>
            </div>
        </div>
    </Link>
);

export default Item;
