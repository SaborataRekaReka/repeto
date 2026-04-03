import Link from "next/link";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => (
    <Link
        className="block px-4 py-3 border-b border-n-1 last:border-none dark:border-white"
        href="/crm/customers-details"
    >
        <div className="flex justify-between items-center mb-1 text-sm font-bold">
            <div>{item.name}</div>
            <div>${item.rate}</div>
        </div>
        <div className="flex justify-between items-center text-xs">
            <div>
                {item.date}
                <span className="relative -top-1 inline-block w-0.5 h-0.5 mx-1.5 bg-n-1 rounded-full"></span>{" "}
                {item.product}
            </div>
            <div
                className={`min-w-[5.25rem] label-green md:min-w-[4.125rem] md:!h-4.5 ${
                    item.status === "Pending" ? "label-yellow" : ""
                }`}
            >
                {item.status}
            </div>
        </div>
    </Link>
);

export default Item;
