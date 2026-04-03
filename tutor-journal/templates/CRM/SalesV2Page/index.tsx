import Layout from "@/components/Layout";
import Filters from "@/components/Filters";
import TablePagination from "@/components/TablePagination";
import Products from "./Products";

import { sales2 } from "@/mocks/crm";

const SalesV2Page = () => {
    return (
        <Layout title="Sales">
            <Filters />
            <Products items={sales2} />
            <TablePagination />
        </Layout>
    );
};

export default SalesV2Page;
