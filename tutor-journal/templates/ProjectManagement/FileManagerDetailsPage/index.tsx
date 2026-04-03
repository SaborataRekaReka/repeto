import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import Users from "@/components/Users";
import Details from "./Details";

const FileManagerDetailsPage = () => {
    return (
        <Layout title="File Manager / Recent Uploads / …" back>
            <div className="flex lg:block">
                <div className="card grow pt-9 px-9 pb-15 lg:mb-6 lg:bg-transparent lg:p-0 lg:border-none dark:lg:bg-transparent">
                    <div className="flex justify-between mb-42 xl:mb-24 lg:mb-8 md:mb-8 md:space-x-4">
                        <button className="btn-stroke btn-small md:flex-1">
                            <Icon name="dots" />
                            <span>Actions</span>
                        </button>
                        <button className="btn-stroke btn-small md:flex-1">
                            <Icon name="add-member" />
                            <span>Share</span>
                        </button>
                    </div>
                    <div className="text-center">
                        <div className="flex justify-center items-center w-24 h-24 mx-auto mb-6 bg-background lg:mb-3 md:w-15 md:h-15">
                            <Image
                                src="/images/sketch.svg"
                                width={60}
                                height={60}
                                alt=""
                            />
                        </div>
                        <div className="mb-1 text-h2 md:text-h3">
                            SaaS UI kit.sketch
                        </div>
                        <div className="mb-26 lg:mb-10 md:mb-6">168.5 mb</div>
                        <Users
                            className="justify-center mb-16 lg:mb-6"
                            items={[
                                "/images/avatars/avatar-5.jpg",
                                "/images/avatars/avatar-8.jpg",
                                "/images/avatars/avatar-12.jpg",
                            ]}
                            large
                            border
                        />
                        <button className="inline-flex justify-center items-center text-xs font-bold">
                            <Icon
                                className="mr-1 dark:fill-white"
                                name="marker"
                            />
                            Add label
                        </button>
                    </div>
                </div>
                <Details />
            </div>
        </Layout>
    );
};

export default FileManagerDetailsPage;
