import { useState } from "react";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import TransactionDetails from "@/components/TransactionDetails";

type LatestTransfersProps = {
    items: any;
};

const LatestTransfers = ({ items }: LatestTransfersProps) => {
    const [visible, setVisible] = useState<boolean>(false);

    return (
        <>
            <div className="">
                <div className="mb-2 text-h6">Latest transfers</div>
                <div className="-mx-5 mb-2">
                    {items.slice(0, 3).map((item: any) => (
                        <div
                            className="flex items-center px-5 py-3.5 border-b border-n-1 last:border-none dark:border-white"
                            key={item.id}
                        >
                            <div
                                className="group flex items-center cursor-pointer grow"
                                onClick={() => setVisible(true)}
                            >
                                <div className="shrink-0 w-9 h-9">
                                    <Image
                                        className="w-full"
                                        src={item.logo}
                                        width={36}
                                        height={36}
                                        alt="Logo"
                                    />
                                </div>
                                <div className="grow px-3.5">
                                    <div className="text-sm font-bold transition-colors group-hover:text-purple-1">
                                        {item.title}
                                    </div>
                                    <div className="text-xs font-medium text-n-3 dark:text-white/75">
                                        {item.details}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <div className="text-sm font-bold">
                                    {item.price}
                                </div>
                                <div className="text-xs font-medium text-n-3 dark:text-white/75">
                                    {item.date}
                                </div>
                            </div>
                            <button className="btn-transparent-dark btn-square btn-small shrink-0 -mr-1.5 ml-3.5 md:hidden">
                                <Icon name="dots" />
                            </button>
                        </div>
                    ))}
                </div>
                <button className="btn-stroke btn-small w-full">
                    <Icon name="dots" />
                    <span>See all transactions</span>
                </button>
            </div>
            <TransactionDetails
                visible={visible}
                onClose={() => setVisible(false)}
            />
        </>
    );
};

export default LatestTransfers;
