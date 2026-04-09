import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Actions from "@/components/Actions";
import Sorting from "@/components/Sorting";
import Checkbox from "@/components/Checkbox";
import TablePagination from "@/components/TablePagination";
import Row from "./Row";
import Item from "./Item";

import { useHydrated } from "@/hooks/useHydrated";

import { customers2 } from "@/mocks/crm";

const CustomersV2Page = () => {
    const [valueAll, setValueAll] = useState<boolean>(false);
    const { mounted } = useHydrated();

    const isTablet = useMediaQuery({
        query: "(max-width: 1023px)",
    });

    return (
        <Layout title="Customers">
            <Actions />
            {mounted && isTablet ? (
                <div className="card">
                    {customers2.map((customer) => (
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
                                <Sorting title="Product" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Date" />
                            </th>
                            <th className="th-custom text-right">
                                <Sorting title="Rate" />
                            </th>
                            <th className="th-custom text-right">
                                <Sorting title="Status" />
                            </th>
                            <th className="th-custom text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers2.map((customer) => (
                            <Row item={customer} key={customer.id} />
                        ))}
                    </tbody>
                </table>
            )}
            <TablePagination />
        </Layout>
    );
};

export default CustomersV2Page;
