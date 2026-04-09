import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Sorting from "@/components/Sorting";
import Checkbox from "@/components/Checkbox";
import Row from "./Row";
import Item from "./Item";

import { useHydrated } from "@/hooks/useHydrated";

type ProductsProps = {
    items: any;
};

const Products = ({ items }: ProductsProps) => {
    const [valueAll, setValueAll] = useState<boolean>(false);
    const { mounted } = useHydrated();

    const isTablet = useMediaQuery({
        query: "(max-width: 1023px)",
    });

    return mounted && isTablet ? (
        <div className="card">
            {items.map((product: any) => (
                <Item item={product} key={product.id} />
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
                        <Sorting title="Date" />
                    </th>
                    <th className="th-custom">
                        <Sorting title="Product" />
                    </th>
                    <th className="th-custom">
                        <Sorting title="Customer" />
                    </th>
                    <th className="th-custom text-right">
                        <Sorting title="Amount" />
                    </th>
                    <th className="th-custom text-right">
                        <Sorting title="Status" />
                    </th>
                    <th className="th-custom w-15 px-0 text-right"></th>
                </tr>
            </thead>
            <tbody>
                {items.map((product: any) => (
                    <Row item={product} key={product.id} />
                ))}
            </tbody>
        </table>
    );
};

export default Products;
