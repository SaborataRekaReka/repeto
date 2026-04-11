import Link from "next/link";
import Image from "@/components/Image";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => (
    <Link
        className="flex items-center px-4 py-3 border-b border-n-1 last:border-none dark:border-white"
        href="/crm/customers-details"
    >
        <div className="relative w-8 h-8">
            <Image
                className="object-cover rounded-full"
                src={item.avatar}
                fill
                alt="Avatar"
            />
        </div>
        <div className="grow">
            <div className="pl-3.5">
                <div className="flex justify-between text-sm font-bold">
                    <div>{item.name}</div>
                    <div>${item.price}</div>
                </div>
                <div className="flex justify-between text-xs">
                    <div>{item.date}</div>
                    <div>{item.product}</div>
                </div>
            </div>
        </div>
    </Link>
);

export default Item;
