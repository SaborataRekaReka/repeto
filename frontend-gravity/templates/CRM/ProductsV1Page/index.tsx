import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Sorting from "@/components/Sorting";
import TablePagination from "@/components/TablePagination";
import Row from "./Row";
import Item from "./Item";

import { useHydrated } from "@/hooks/useHydrated";

import { products1 } from "@/mocks/crm";

const ProductsV1Page = () => {
    const { mounted } = useHydrated();

    const isTablet = useMediaQuery({
        query: "(max-width: 1023px)",
    });

    return (
        <Layout title="Products">
            {mounted && isTablet ? (
                <div className="card">
                    {products1.map((product) => (
                        <Item item={product} key={product.id} />
                    ))}
                </div>
            ) : (
                <table className="table-custom">
                    <thead>
                        <tr>
                            <th className="th-custom">
                                <Sorting title="Name" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Details" />
                            </th>
                            <th className="th-custom text-right">
                                <Sorting title="Sold" />
                            </th>
                            <th className="th-custom">
                                <Sorting title="Stock" />
                            </th>
                            <th className="th-custom text-right">
                                <Sorting title="Price" />
                            </th>
                            <th className="th-custom text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products1.map((product) => (
                            <Row item={product} key={product.id} />
                        ))}
                    </tbody>
                </table>
            )}
            <TablePagination />
        </Layout>
    );
};

export default ProductsV1Page;
