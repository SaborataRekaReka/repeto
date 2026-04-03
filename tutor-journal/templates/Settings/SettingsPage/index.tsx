import { useState } from "react";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import Icon from "@/components/Icon";
import Account from "./Account";
import Security from "./Security";
import Notifications from "./Notifications";
import Policies from "./Policies";
import Integrations from "./Integrations";
import { getInitials } from "@/mocks/students";

const tutorProfile = {
    name: "Смирнов Алексей Иванович",
    email: "tutor@repetitorjournal.ru",
    avatar: null,
};

const SettingsPage = () => {
    const [type, setType] = useState<string>("account");

    const types = [
        { title: "Аккаунт", value: "account" },
        { title: "Безопасность", value: "security" },
        { title: "Уведомления", value: "notifications" },
        { title: "Политики", value: "policies" },
        { title: "Интеграции", value: "integrations" },
    ];

    return (
        <Layout title="Настройки">
            <div className="flex pt-4 lg:block">
                <div className="shrink-0 w-[20rem] 4xl:w-[14.7rem] lg:w-full lg:mb-8">
                    <div className="card lg:flex lg:items-center lg:gap-4">
                        <div className="p-5 lg:p-4">
                            <div className="flex items-center justify-center w-[5.25rem] h-[5.25rem] mx-auto mb-3 rounded-full bg-purple-3 text-xl font-bold text-n-1 lg:w-12 lg:h-12 lg:mx-0 lg:mb-0 lg:text-sm dark:bg-purple-1/20">
                                {getInitials(tutorProfile.name)}
                            </div>
                            <div className="text-center lg:text-left">
                                <div className="text-h6 lg:text-sm">
                                    {tutorProfile.name}
                                </div>
                                <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                    {tutorProfile.email}
                                </div>
                            </div>
                            <button className="btn-stroke btn-small w-full mt-4 hidden lg:hidden">
                                Изменить фото
                            </button>
                        </div>
                    </div>
                </div>
                <div className="w-[calc(100%-20rem)] pl-[6.625rem] 4xl:w-[calc(100%-14.7rem)] 2xl:pl-10 lg:w-full lg:pl-0">
                    <div className="flex justify-between mb-6 md:overflow-auto md:-mx-5 md:scrollbar-none md:before:w-5 md:before:shrink-0 md:after:w-5 md:after:shrink-0">
                        <Tabs
                            className="2xl:ml-0 md:flex-nowrap"
                            classButton="2xl:ml-0 md:whitespace-nowrap"
                            items={types}
                            value={type}
                            setValue={setType}
                        />
                    </div>
                    {type === "account" && <Account />}
                    {type === "security" && <Security />}
                    {type === "notifications" && <Notifications />}
                    {type === "policies" && <Policies />}
                    {type === "integrations" && <Integrations />}
                </div>
            </div>
        </Layout>
    );
};

export default SettingsPage;
