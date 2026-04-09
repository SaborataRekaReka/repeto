import Layout from "@/components/Layout";
import Actions from "@/components/Actions";
import TablePagination from "@/components/TablePagination";
import Item from "./Item";

import { customers3 } from "@/mocks/crm";

const CustomersV3Page = () => {
    return (
        <Layout title="Customers">
            <Actions />
            <div className="flex flex-wrap -mt-5 -mx-2.5 md:-mt-3">
                {customers3.map((customer) => (
                    <Item item={customer} key={customer.id} />
                ))}
            </div>
            <TablePagination />
        </Layout>
    );
};

export default CustomersV3Page;
