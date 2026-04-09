import Layout from "@/components/Layout";
import Filters from "@/components/Filters";
import TablePagination from "@/components/TablePagination";
import Products from "@/components/Products";

import { products2 } from "@/mocks/crm";

const ProductsV2Page = () => {
    return (
        <Layout title="Products">
            <Filters />
            <Products items={products2} />
            <TablePagination />
        </Layout>
    );
};

export default ProductsV2Page;
