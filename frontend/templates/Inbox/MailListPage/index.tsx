import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Search from "@/components/Search";
import TablePagination from "@/components/TablePagination";
import MailDesktop from "./MailDesktop";
import MailTablet from "./MailTablet";

import { useHydrated } from "@/hooks/useHydrated";

import { mails } from "@/mocks/inbox";

const MailListPage = () => {
    const [type, setType] = useState<string>("incoming");
    const [search, setSearch] = useState<string>("");
    const { mounted } = useHydrated();

    const isTablet = useMediaQuery({
        query: "(max-width: 1023px)",
    });

    const types = [
        {
            title: "Incoming",
            value: "incoming",
        },
        {
            title: "Sent",
            value: "sent",
        },
        {
            title: "Drafts",
            value: "drafts",
        },
        {
            title: "Deleted",
            value: "deleted",
        },
    ];

    return (
        <Layout title="Inbox">
            <div className="flex justify-between items-center mb-6 lg:flex-wrap lg:mb-5">
                <button className="btn-stroke btn-small md:w-8 md:mr-3 md:px-0 md:text-0">
                    <Icon className="md:!m-0" name="edit" />
                    <span>Compose Email</span>
                </button>
                <Tabs
                    className="lg:order-3 lg:w-full lg:mt-4 md:ml-0 md:mt-3"
                    classButton="md:grow md:ml-0"
                    items={types}
                    value={type}
                    setValue={setType}
                />
                <Search
                    className="md:w-[calc(100%-2.75rem)]"
                    placeholder="Type to search..."
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    onSubmit={() => console.log("Submit")}
                />
            </div>
            <div className="card">
                {mails.map((mail) =>
                    mounted && isTablet ? (
                        <MailTablet item={mail} key={mail.id} />
                    ) : (
                        <MailDesktop item={mail} key={mail.id} />
                    )
                )}
            </div>
            <TablePagination />
        </Layout>
    );
};

export default MailListPage;
