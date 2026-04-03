import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Image from "@/components/Image";
import Tabs from "@/components/Tabs";
import Profile from "./Profile";
import OrdersHistoryDesktop from "./OrdersHistoryDesktop";
import OrdersHistoryTablet from "./OrdersHistoryTablet";
import DeliveryAndPayments from "./DeliveryAndPayments";

import { useHydrated } from "@/hooks/useHydrated";

import { ordersHistory } from "@/mocks/crm";

const CustomersDetailsPage = () => {
    const [type, setType] = useState<string>("details");
    const { mounted } = useHydrated();

    const isTablet = useMediaQuery({
        query: "(max-width: 1023px)",
    });

    const typeTasks = [
        {
            title: "Details",
            value: "details",
        },
        {
            title: "Orders",
            value: "orders",
        },
        {
            title: "Delivery",
            value: "delivery",
        },
    ];

    return (
        <Layout title="All Customers" back>
            {mounted && isTablet ? (
                <>
                    <div className="mb-12 pt-4 text-center">
                        <div className="relative w-[5.25rem] h-[5.25rem] mx-auto mb-2.5">
                            <Image
                                className="object-cover rounded-full"
                                src="/images/avatar-3.jpg"
                                fill
                                alt="Avatar"
                            />
                        </div>
                        <div className="text-h4">Gabriel Soares</div>
                        <div className="text-sm">London, UK</div>
                    </div>
                    <Tabs
                        className="mb-6"
                        classButton="md:grow"
                        items={typeTasks}
                        value={type}
                        setValue={setType}
                    />
                    {type === "details" && <Profile />}
                    {type === "orders" && (
                        <OrdersHistoryTablet items={ordersHistory} />
                    )}
                    {type === "delivery" && <DeliveryAndPayments />}
                </>
            ) : (
                <div className="flex pt-4">
                    <div className="shrink-0 w-[18rem] 4xl:w-[14.68rem]">
                        <Profile />
                    </div>
                    <div className="w-[calc(100%-18rem)] pl-[5.125rem] 4xl:w-[calc(100%-14.68rem)] 2xl:pl-16 xl:pl-10">
                        <OrdersHistoryDesktop items={ordersHistory} />
                        <DeliveryAndPayments />
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CustomersDetailsPage;
