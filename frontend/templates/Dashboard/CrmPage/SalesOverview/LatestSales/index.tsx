import Image from "@/components/Image";
import Icon from "@/components/Icon";

type LatestSalesProps = {
    items: any;
};

const LatestSales = ({ items }: LatestSalesProps) => (
    <div className="">
        <div className="flex justify-between items-center mb-4 px-5">
            <div className="font-bold">Latest Sales</div>
            <button className="text-xs font-bold transition-colors hover:text-purple-1">
                See all sales breakdown
            </button>
        </div>
        <div className="table w-full">
            {items.map((item: any) => (
                <div className="table-row group" key={item.id}>
                    <div className="table-cell border-b border-n-1 align-middle py-2 pl-5 pr-2 text-sm group-last:pb-4 group-last:border-none dark:border-white">
                        <div className="inline-flex items-center text-sm font-bold">
                            <div className="w-15 mr-3 border border-n-1">
                                <Image
                                    className="w-full"
                                    src={item.image}
                                    width={60}
                                    height={42}
                                    alt=""
                                />
                            </div>
                            {item.title}
                        </div>
                    </div>
                    <div className="table-cell border-b border-n-1 align-middle py-2 px-2 text-sm font-medium group-last:pb-4 group-last:border-none md:hidden dark:border-white">
                        {item.date}
                    </div>
                    <div className="table-cell border-b border-n-1 align-middle py-2 px-2 text-right text-sm font-bold group-last:pb-4 group-last:border-none dark:border-white">
                        ${item.price}
                    </div>
                    <div className="table-cell border-b border-n-1 align-middle text-center py-2 px-2 text-sm group-last:pb-4 group-last:border-none md:hidden dark:border-white">
                        <div
                            className={`min-w-[5.25rem] ${
                                item.status === "Paid"
                                    ? "label-green"
                                    : item.status === "Pending"
                                    ? "label-yellow"
                                    : "label-purple"
                            }`}
                        >
                            {item.status}
                        </div>
                    </div>
                    <div className="table-cell border-b border-n-1 align-middle text-right w-8 py-2 pl-2 pr-5 text-sm group-last:pb-4 group-last:border-none md:pr-3 dark:border-white">
                        <button className="btn-transparent-dark btn-small btn-square">
                            <Icon name="dots" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default LatestSales;
