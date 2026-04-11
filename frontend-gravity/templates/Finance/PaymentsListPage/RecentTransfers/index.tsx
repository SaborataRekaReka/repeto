import { useState } from "react";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import RecipientDetails from "../RecipientDetails";

type RecentTransfersProps = {
    items: any;
};

const RecentTransfers = ({ items }: RecentTransfersProps) => {
    const [visible, setVisible] = useState<boolean>(false);

    return (
        <>
            <div className="card pt-5 px-5 pb-6">
                <div className="mb-3 text-h6">Recent transfers</div>
                <div className="-mx-5 mb-1">
                    {items.map((item: any) => (
                        <button
                            className="flex items-center w-full px-5 py-3.5 pb-4 border-b border-n-1 text-left transition-colors hover:text-purple-1 last:border-none dark:border-white"
                            key={item.id}
                            onClick={() => setVisible(true)}
                        >
                            <div className="shrink-0 w-8 h-8">
                                <Image
                                    className="w-full object-cover rounded-full"
                                    src={item.avatar}
                                    width={32}
                                    height={32}
                                    alt="Avatar"
                                />
                            </div>
                            <div className="grow pl-3">
                                <div className="text-sm font-bold">
                                    {item.title}
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium text-n-3 dark:text-white/75">
                                    <div>Account ending in {item.details}</div>
                                    <div className="flex items-center uppercase">
                                        <div className="w-3.5 h-3.5 mr-1">
                                            <Image
                                                className="w-full"
                                                src={`/images/${item.currency}.svg`}
                                                width={32}
                                                height={32}
                                                alt="Avatar"
                                            />
                                        </div>
                                        {item.currency}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                <button className="btn-stroke btn-small w-full">
                    <Icon name="dots" />
                    <span>See all transactions</span>
                </button>
            </div>
            <RecipientDetails
                visible={visible}
                onClose={() => setVisible(false)}
            />
        </>
    );
};

export default RecentTransfers;
