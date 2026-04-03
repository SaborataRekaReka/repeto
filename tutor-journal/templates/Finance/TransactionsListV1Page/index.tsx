import { useState } from "react";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import TransactionDetails from "@/components/TransactionDetails";

import { transactions2 } from "@/mocks/finance";

const TransactionsListV1Page = () => {
    const [type, setType] = useState<string>("all-accounts");
    const [visible, setVisible] = useState<boolean>(false);

    const types = [
        {
            title: "All Accounts",
            value: "all-accounts",
        },
        {
            title: "USD Account",
            value: "usd-account",
        },
        {
            title: "EUR Account",
            value: "eur-account",
        },
        {
            title: "GBP Account",
            value: "gbp-account",
        },
    ];

    return (
        <>
            <Layout title="Transactions">
                <div className="flex mb-6 md:block md:mb-5">
                    <Tabs
                        className="mr-auto md:flex-nowrap md:overflow-auto md:-mx-5 md:scrollbar-none md:scroll-smooth md:before:w-5 md:before:shrink-0 md:after:w-5 md:after:shrink-0"
                        classButton="md:ml-0"
                        items={types}
                        value={type}
                        setValue={setType}
                    />
                    <button className="btn-stroke btn-small mr-1.5 lg:hidden">
                        <Icon name="filters" />
                        <span>Apply Filter</span>
                    </button>
                    <button className="btn-stroke btn-small lg:hidden">
                        <Icon name="document" />
                        <span>Export to CSV</span>
                    </button>
                </div>
                <div className="card">
                    {transactions2.map((transaction: any) => (
                        <div
                            className="flex items-center px-5 py-3.5 border-b border-n-1 last:border-none md:px-4 dark:border-white"
                            key={transaction.id}
                        >
                            <div
                                className="group flex items-center cursor-pointer grow"
                                onClick={() => setVisible(true)}
                            >
                                <div className="shrink-0 w-9 h-9">
                                    <Image
                                        className="w-full"
                                        src={transaction.logo}
                                        width={36}
                                        height={36}
                                        alt="Logo"
                                    />
                                </div>
                                <div className="grow px-3.5">
                                    <div className="text-sm font-bold transition-colors group-hover:text-purple-1">
                                        {transaction.title}
                                    </div>
                                    <div className="text-xs font-medium text-n-3 dark:text-white/75">
                                        {transaction.details}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <div className="text-sm font-bold">
                                    {transaction.price}
                                </div>
                                <div className="text-xs font-medium text-n-3 dark:text-white/75">
                                    {transaction.date}
                                </div>
                            </div>
                            <button className="btn-transparent-dark btn-square btn-small shrink-0 -mr-1.5 ml-3.5 md:hidden">
                                <Icon name="dots" />
                            </button>
                        </div>
                    ))}
                </div>
            </Layout>
            <TransactionDetails
                visible={visible}
                onClose={() => setVisible(false)}
            />
        </>
    );
};

export default TransactionsListV1Page;
