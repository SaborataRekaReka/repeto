import Layout from "@/components/Layout";
import Profile from "@/components/Profile";
import Reviews from "./Reviews";

const ProfilePage = () => {
    return (
        <Layout title="All Contacts" back>
            <div className="flex lg:flex-col-reverse">
                <div className="w-[calc(100%-20rem)] pr-[6.625rem] 4xl:w-[calc(100%-14.7rem)] 2xl:pr-20 xl:pr-12 lg:w-full lg:pr-0">
                    <Reviews />
                </div>
                <div className="shrink-0 w-[20rem] 4xl:w-[14.7rem] lg:w-full lg:mb-8">
                    <Profile actions />
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;
