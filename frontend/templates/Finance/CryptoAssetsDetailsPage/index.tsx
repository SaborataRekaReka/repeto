import Layout from "@/components/Layout";
import Details from "./Details";
import PriceStatistics from "./PriceStatistics";
import TopStories from "./TopStories";
import Operation from "./Operation";

const CryptoAssetsDetailsPage = () => {
    return (
        <Layout title="Bitcoin (BTC)" back>
            <div className="flex -mx-2.5 mb-6 lg:block lg:mx-0 lg:mb-5">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <Details />
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <PriceStatistics />
                </div>
            </div>
            <div className="flex -mx-2.5 lg:block lg:mx-0">
                <div className="w-[calc(66.666%-1.25rem)] mx-2.5 lg:w-full lg:mx-0 lg:mb-5">
                    <TopStories />
                </div>
                <div className="w-[calc(33.333%-1.25rem)] mx-2.5 lg:w-full lg:mx-0">
                    <Operation />
                </div>
            </div>
        </Layout>
    );
};

export default CryptoAssetsDetailsPage;
