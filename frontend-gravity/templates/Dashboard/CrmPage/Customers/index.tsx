import { useState } from "react";
import Icon from "@/components/Icon";
import Search from "@/components/Search";

import { customers } from "@/mocks/dashboard";

type CustomersProps = {};

const Customers = ({}: CustomersProps) => {
    const [search, setSearch] = useState<string>("");

    return (
        <div className="card">
            <div className="card-head mb-5.5">
                <div className="mr-auto text-h6">Customers</div>
                <button className="transition-colors text-0 hover:fill-purple-1 dark:fill-white dark:hover:fill-purple-1">
                    <Icon className="icon-18 fill-inherit" name="calendar" />
                </button>
            </div>
            <Search
                className="w-auto mt-5 mx-4 mb-2"
                placeholder="Type to search"
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                onSubmit={() => console.log("Submit")}
            />
            <div>
                {customers.map((customer) => (
                    <div
                        className="px-4 py-3 border-t border-n-1 first:border-none dark:border-white"
                        key={customer.id}
                    >
                        <div className="flex justify-between item-center mb-1.5 font-bold text-sm">
                            <div>{customer.man}</div>
                            <div>${customer.price}</div>
                        </div>
                        <div className="text-xs">
                            {customer.date}
                            <span className="relative -top-1 inline-block w-0.5 h-0.5 mx-1.5 rounded-full bg-n-1"></span>
                            {customer.project}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Customers;
