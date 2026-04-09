import Layout from "@/components/Layout";
import Statistics from "./Statistics";
import LatestUpdates from "./LatestUpdates";
import Contacts from "./Contacts";

const SocialPage = () => {
    return (
        <Layout title="Dashboard">
            <Statistics />
            <div className="flex mt-4 -mx-2.5 lg:block lg:mx-0 lg:mt-6">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-6">
                    <LatestUpdates />
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <Contacts />
                </div>
            </div>
        </Layout>
    );
};

export default SocialPage;
