import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Sorting from "@/components/Sorting";
import Checkbox from "@/components/Checkbox";
import TablePagination from "@/components/TablePagination";
import Row from "./Row";
import Item from "./Item";

import { useHydrated } from "@/hooks/useHydrated";

import { customers1 } from "@/mocks/crm";

const CustomersV1Page = () => {
    const [type, setType] = useState<string>("all-customers");
    const [valueAll, setValueAll] = useState<boolean>(false);
    const { mounted } = useHydrated();

    const isTablet = useMediaQuery({
        query: "(max-width: 1023px)",
    });

    const types = [
        {
            title: "All Customers",
            value: "all-customers",
        },
        {
            title: "Payment Pending",
            value: "payment-pending",
        },
        {
            title: "Paid",
            value: "paid",
        },
        {
            title: "Invoice Sent",
            value: "invoice-sent",
        },
    ];

    return (
        <Layout title="Customers">
            <div className="flex mb-6 md:block md:mb-5">
                <Tabs
                    className="mr-auto md:ml-0 md:-mr-1"
                    classButton="md:grow md:ml-0 md:px-2"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <button className="btn-stroke btn-small mr-1.5 lg:hidden">
                    <Icon name="filters" />
                    <span>Sort: A-Z</span>
                </button>
                <button className="btn-stroke btn-small md:hidden">
                    <Icon name="dots" />
                    <span>Bulk Actions</span>
                </button>
            </div>
            {mounted && isTablet ? (
                <div className="card">
                    {customers1.map((customer) => (
                        <Item item={customer} key={customer.id} />
                    ))}
                </div>
            ) : (
                <table className="table-custom table-select">
                    <thead>
                        <tr>
                            <th className="th-custom">
                                <Checkbox
                                    value={valueAll}
                                    onChange={() => setValueAll(!valueAll)}
                                />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Name" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Date" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Email" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Product" />
                            </th>
                            <th className="th-custom text-right">
                                <Sorting title="Price" />
                            </th>
                            <th className="th-custom text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers1.map((customer) => (
                            <Row item={customer} key={customer.id} />
                        ))}
                    </tbody>
                </table>
            )}
            <TablePagination />
        </Layout>
    );
};

export default CustomersV1Page;
