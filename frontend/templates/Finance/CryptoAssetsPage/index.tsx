import { useState } from "react";
import Layout from "@/components/Layout";
import Select from "@/components/Select";
import Tabs from "@/components/Tabs";
import Sorting from "@/components/Sorting";
import TablePagination from "@/components/TablePagination";
import Card from "./Card";
import Row from "./Row";

import { market, assets } from "@/mocks/finance";

const currencies = [
    {
        id: "0",
        title: "USD",
    },
    {
        id: "1",
        title: "EUR",
    },
    {
        id: "2",
        title: "GBP",
    },
];

const CryptoAssetsPage = () => {
    const [currency, setCurrency] = useState<any>(currencies[0]);
    const [type, setType] = useState<string>("all-assets");
    const [duration, setDuration] = useState<string>("1h");

    const typeTasks = [
        {
            title: "All assets",
            value: "all-assets",
        },
        {
            title: "Tradable",
            value: "tradable",
        },
        {
            title: "Gainers",
            value: "gainers",
        },
        {
            title: "Losers",
            value: "losers",
        },
    ];

    const durations = [
        {
            title: "1H",
            value: "1h",
        },
        {
            title: "24H",
            value: "24h",
        },
        {
            title: "1W",
            value: "1w",
        },
        {
            title: "1M",
            value: "1m",
        },
    ];

    return (
        <Layout title="Crypto Assets">
            <div className="flex mb-6 md:mb-5">
                <div>
                    <div className="mb-0.5 text-h5">
                        Market is up <span className="text-green-1">7.49%</span>
                    </div>
                    <div className="text-sm font-medium text-n-3 dark:text-white/50">
                        In the past 24 hours
                    </div>
                </div>
                <div className="flex items-center h-8 px-3 ml-auto border border-n-1 text-xs font-bold dark:border-white">
                    Currency:
                    <Select
                        className="ml-1"
                        classButton="h-auto px-0 border-none bg-trasparent"
                        classOptions="-left-4 -right-3 w-auto py-1"
                        classArrow="ml-1"
                        items={currencies}
                        value={currency}
                        onChange={setCurrency}
                        small
                    />
                </div>
            </div>
            <div className="flex -mx-2.5 mb-7 lg:block lg:mx-0">
                {market.map((card) => (
                    <Card item={card} key={card.id} />
                ))}
            </div>
            <div className="flex justify-between mb-5 md:block">
                <Tabs
                    className="lg:ml-0"
                    classButton="lg:ml-0 md:flex-1 md:px-3"
                    items={typeTasks}
                    value={type}
                    setValue={setType}
                />
                <Tabs
                    className="lg:ml-0 md:hidden"
                    classButton="lg:ml-0"
                    items={durations}
                    value={duration}
                    setValue={setDuration}
                />
            </div>
            <table className="table-custom">
                <thead className="md:hidden">
                    <tr>
                        <th className="th-custom">
                            <Sorting title="Name" />
                        </th>
                        <th className="th-custom text-right">
                            <Sorting title="Volume" />
                        </th>
                        <th className="th-custom text-right">
                            <Sorting title="Market cap" />
                        </th>
                        <th className="th-custom text-right">
                            <Sorting title="Price" />
                        </th>
                        <th className="th-custom text-right">
                            <Sorting title="Change" />
                        </th>
                        <th className="th-custom text-right lg:hidden"></th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset) => (
                        <Row item={asset} key={asset.id} />
                    ))}
                </tbody>
            </table>
            <TablePagination />
        </Layout>
    );
};

export default CryptoAssetsPage;
