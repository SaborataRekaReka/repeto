import Layout from "@/components/Layout";
import Filters from "@/components/Filters";
import TablePagination from "@/components/TablePagination";
import Products from "./Products";

import { sales1 } from "@/mocks/crm";

const SalesV1Page = () => {
    return (
        <Layout title="Sales">
            <Filters />
            <Products items={sales1} />
            <TablePagination />
        </Layout>
    );
};

export default SalesV1Page;
