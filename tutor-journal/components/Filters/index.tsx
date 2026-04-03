import { useState } from "react";
import Icon from "@/components/Icon";
import Search from "@/components/Search";

const filtersChoice = ["All Customers", "A-Z"];

type FiltersProps = {};

const Filters = ({}: FiltersProps) => {
    const [search, setSearch] = useState<string>("");

    return (
        <div className="flex mb-6 md:flex-wrap">
            <button className="btn-purple btn-small">
                <Icon name="filters" />
                <span>All Filters</span>
            </button>
            <div className="flex flex-wrap md:order-3 md:mt-3 md:-ml-3">
                {filtersChoice.map((item, index) => (
                    <div
                        className="flex items-center ml-3 text-xs font-bold"
                        key={index}
                    >
                        <button className="group -mt-0.5 mr-1">
                            <Icon
                                className="transition-colors dark:fill-white group-hover:fill-pink-1"
                                name="close"
                            />
                        </button>
                        {item}
                    </div>
                ))}
            </div>
            <Search
                className="ml-auto md:w-[64%]"
                placeholder="Search"
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                onSubmit={() => console.log("Submit")}
            />
        </div>
    );
};

export default Filters;
