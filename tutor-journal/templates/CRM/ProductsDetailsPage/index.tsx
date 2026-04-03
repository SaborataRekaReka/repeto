import { useState } from "react";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Profile from "./Profile";
import GeneralInformation from "./GeneralInformation";

const ProductsDetailsPage = () => {
    const [type, setType] = useState<string>("general-information");

    const types = [
        {
            title: "General information",
            value: "general-information",
        },
        {
            title: "Pricing",
            value: "pricing",
        },
        {
            title: "Delivery",
            value: "delivery",
        },
        {
            title: "Returns",
            value: "returns",
        },
    ];

    return (
        <Layout title="Product details" back>
            <div className="flex pt-4 lg:block md:pt-0">
                <div className="shrink-0 w-[20rem] 4xl:w-[14.7rem] lg:w-full lg:mb-10 md:mb-8">
                    <Profile />
                </div>
                <div className="w-[calc(100%-20rem)] pl-[6.625rem] 4xl:w-[calc(100%-14.7rem)] 2xl:pl-16 xl:pl-10 lg:w-full lg:pl-0">
                    <div className="flex justify-between mb-6 md:block md:mb-5">
                        <Tabs
                            className="md:ml-0"
                            classButton="md:grow md:ml-0 md:px-2.5"
                            items={types}
                            value={type}
                            setValue={setType}
                        />
                        <button className="btn-stroke btn-small shrink-0 min-w-[6rem] ml-4 md:hidden">
                            <Icon name="dots" />
                            <span>Actions</span>
                        </button>
                    </div>
                    <GeneralInformation />
                </div>
            </div>
        </Layout>
    );
};

export default ProductsDetailsPage;
