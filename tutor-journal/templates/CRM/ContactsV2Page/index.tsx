import { useState } from "react";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Sorting from "@/components/Sorting";
import Checkbox from "@/components/Checkbox";
import TablePagination from "@/components/TablePagination";
import Row from "./Row";

import { contacts2 } from "@/mocks/crm";

const ContactsV2Page = () => {
    const [type, setType] = useState<string>("all-contacts");
    const [valueAll, setValueAll] = useState<boolean>(false);

    const types = [
        {
            title: "All Contacts",
            value: "all-contacts",
        },
        {
            title: "Teammates",
            value: "teammates",
        },
        {
            title: "Customers",
            value: "customers",
        },
    ];

    return (
        <Layout title="All contacts">
            <div className="flex mb-6 md:mb-5 md:block">
                <Tabs
                    className="mr-auto md:ml-0"
                    classButton="md:ml-0 md:grow"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <button className="btn-stroke btn-small mr-1.5 md:hidden">
                    <Icon name="filters" />
                    <span>Sort: A-Z</span>
                </button>
                <button className="btn-stroke btn-small md:hidden">
                    <Icon name="dots" />
                    <span>Bulk Actions</span>
                </button>
            </div>
            <table className="table-custom table-select">
                <thead className="md:hidden">
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
                        <th className="th-custom lg:hidden">
                            <Sorting title="Email" />
                        </th>
                        <th className="th-custom">
                            <Sorting title="Access" />
                        </th>
                        <th className="th-custom text-right"></th>
                    </tr>
                </thead>
                <tbody>
                    {contacts2.map((contact) => (
                        <Row item={contact} key={contact.id} />
                    ))}
                </tbody>
            </table>
            <TablePagination />
        </Layout>
    );
};

export default ContactsV2Page;
