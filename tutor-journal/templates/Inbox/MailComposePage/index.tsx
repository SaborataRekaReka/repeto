import { useState } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Comment from "@/components/Comment";
import Message from "./Message";

const images = [
    "/images/screenshot-9.jpg",
    "/images/screenshot-10.jpg",
    "/images/screenshot-11.jpg",
];

const MailComposePage = () => {
    const [value, setValue] = useState<string>("");

    return (
        <Layout title="Inbox" back>
            <div className="flex justify-between items-center mb-6 md:mb-5">
                <button className="btn-stroke btn-small mr-auto md:grow md:mr-2.5">
                    <Icon name="save" />
                    <span>Save as draft</span>
                </button>
                <button className="btn-stroke btn-small mr-2.5 md:grow">
                    <Icon name="forward" />
                    <span>Forward</span>
                </button>
                <button className="btn-stroke btn-small md:grow">
                    <Icon name="remove" />
                    <span>Delete</span>
                </button>
            </div>
            <div className="card">
                <div className="card-title">
                    Re: Solar experiment lets trade energy among themselves
                </div>
                <div className="p-5">
                    <div className="space-y-6">
                        <Message
                            user="Helena Chavez"
                            email="helen.chavez89@outlook.com"
                            avatar="/images/avatars/avatar-10.jpg"
                            date="18 January 2023"
                            time="11:52AM"
                            content={
                                <>
                                    <p>
                                        Working outside the office should help
                                        de-escalate workplace toxicity. But in
                                        reality, dysfunctional workplace culture
                                        may actually get worse when you’re at
                                        home. Instead, her supervisor found new
                                        ways to monitor the team virtually
                                    </p>
                                    <br></br>
                                    <p>
                                        Best Regards, Helena <br></br>Chavez
                                    </p>
                                </>
                            }
                            images={images}
                        />
                        <div className="relative flex justify-center before:absolute before:left-0 before:top-1/2 before:right-0 before:h-0.25 before:bg-n-1 dark:before:bg-white">
                            <div className="relative z-1shrink-0 px-2 py-0.25 bg-purple-1 text-xs font-bold text-n-1">
                                5
                            </div>
                        </div>
                        <Message
                            user="Gladys Kanyinda"
                            email="gladys.kanyinda@outlook.com"
                            avatar="/images/avatars/avatar-15.jpg"
                            date="25 January 2023"
                            time="10:10PM"
                            content={
                                <>
                                    <p>
                                        Toxic work cultures can have major
                                        impacts on employee wellbeing
                                    </p>
                                </>
                            }
                        />
                    </div>
                    <Comment
                        className="mt-16 md:mt-8"
                        avatar="/images/avatars/avatar.jpg"
                        placeholder="Type to add something"
                        value={value}
                        setValue={(e: any) => setValue(e.target.value)}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default MailComposePage;
