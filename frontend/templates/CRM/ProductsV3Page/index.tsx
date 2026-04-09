import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import Actions from "@/components/Actions";
import TablePagination from "@/components/TablePagination";
import Products from "./Products";

import { products3 } from "@/mocks/crm";

const ProductsV3Page = () => {
    return (
        <Layout title="Products">
            <Actions />
            <Products items={products3} />
            <TablePagination />
        </Layout>
    );
};

export default ProductsV3Page;
