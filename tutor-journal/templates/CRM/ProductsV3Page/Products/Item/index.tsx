import Link from "next/link";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => (
    <Link
        className="block px-5 py-4 border-b border-n-1 text-sm last:border-none dark:border-white"
        href="/crm/product-details"
    >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-n-1 dark:border-white">
            <div className="label-black min-w-[5.25rem]">{item.status}</div>
            <div className="">{item.date}</div>
        </div>
        <div className="flex justify-between items-center font-bold mb-1">
            <div>{item.name}</div>
            <div>${item.amount}</div>
        </div>
        <div className="flex justify-between items-center text-xs">
            <div>{item.source}</div>
            <div>${item.rate}</div>
        </div>
    </Link>
);

export default Item;
