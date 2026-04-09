import { useState } from "react";
import Layout from "@/components/Layout";
import Image from "@/components/Image";
import Icon from "@/components/Icon";
import GeneralInformation from "./GeneralInformation";

const menu = [
    {
        id: "0",
        title: "General information",
        content: "Title, company, and more",
        icon: "document",
    },
    {
        id: "1",
        title: "Team",
        content: "Manage members",
        icon: "team",
    },
    {
        id: "2",
        title: "Billing",
        content: "Setup payment methods",
        icon: "card",
    },
    {
        id: "3",
        title: "Apps",
        content: "Linked apps and services",
        icon: "apps",
    },
    {
        id: "4",
        title: "Notifications",
        content: "Your email notifications",
        icon: "notification-bell",
    },
    {
        id: "5",
        title: "Send to Archieve",
        content: "Store project in archieve",
        icon: "archieve",
    },
];

const ProjectsDetailsPage = () => {
    const [activeId, setActiveId] = useState<string>("0");
    const [visible, setVisible] = useState<boolean>(false);

    const handleClick = (id: string) => {
        setActiveId(id);
        setVisible(true);
    };

    return (
        <Layout title="Project details" back>
            <div className="flex card lg:block">
                <div className="relative shrink-0 w-96 pt-19 px-5 pb-7 border-r border-n-1 4xl:w-80 lg:w-full lg:border-none md:pt-12 dark:border-white">
                    <button className="group absolute top-5 right-5 w-8 h-8">
                        <Icon
                            className="transition-colors dark:fill-white group-hover:fill-purple-1"
                            name="camera"
                        />
                    </button>
                    <div className="w-21 h-21 mx-auto mb-3 p-5 bg-background rounded-full">
                        <Image
                            className="w-full"
                            src="/images/slack.svg"
                            width={46}
                            height={46}
                            alt="Logo"
                        />
                    </div>
                    <div className="mb-1 text-center text-h5">
                        Interface development
                    </div>
                    <div className="mb-10 text-center text-sm md:mb-6">
                        Dribbble Inc.
                    </div>
                    <div>
                        {menu.map((button) => (
                            <button
                                className={`flex items-center w-full pl-7 py-4 pr-4 transition-colors tap-highlight-color hover:bg-background/60 dark:hover:bg-n-2 ${
                                    button.id === activeId &&
                                    "bg-background dark:bg-n-2"
                                }`}
                                key={button.id}
                                onClick={() => handleClick(button.id)}
                            >
                                <Icon
                                    className="shrink-0 icon-18 mr-6 dark:fill-white"
                                    name={button.icon}
                                />
                                <div className="grow text-left">
                                    <div className="mb-1 text-sm font-bold">
                                        {button.title}
                                    </div>
                                    <div className="text-xs">
                                        {button.content}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div
                    className={`flex flex-col grow pt-6 pl-10 pr-6 pb-7 lg:fixed lg:inset-0 lg:z-[100] lg:bg-white lg:overflow-auto lg:scroll-smooth lg:py-8 lg:px-5 lg:invisible lg:opacity-0 lg:transition-opacity md:pt-6 dark:bg-n-1 ${
                        visible ? "lg:!visible lg:!opacity-100" : ""
                    }`}
                >
                    <button
                        className="hidden items-center mb-6 text-sm font-bold text-purple-1 tap-highlight-color lg:inline-flex"
                        onClick={() => setVisible(false)}
                    >
                        <Icon
                            className="icon-18 mr-2 fill-purple-1"
                            name="arrow-prev"
                        />
                        Back to the menu
                    </button>
                    <GeneralInformation />
                </div>
            </div>
        </Layout>
    );
};

export default ProjectsDetailsPage;
