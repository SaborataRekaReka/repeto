import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Tabs from "@/components/Tabs";
import { useApi } from "@/hooks/useApi";
import type { StudentPortalData } from "@/types/student-portal";
import LessonsTab from "./LessonsTab";
import HomeworkTab from "./HomeworkTab";
import MaterialsTab from "./MaterialsTab";
import PaymentTab from "./PaymentTab";
import SignUpBanner from "./SignUpBanner";

import Image from "next/image";
import Icon from "@/components/Icon";
import ToggleTheme from "@/components/Footer/ToggleTheme";
import { resolveApiAssetUrl } from "@/lib/api";
import { setPortalTokenForTutor } from "@/lib/portalTokenStore";

const tabItems = [
    { title: "Занятия", value: "lessons" },
    { title: "Домашка", value: "homework" },
    { title: "Материалы", value: "materials" },
    { title: "Оплата", value: "payment" },
];

type Props = {
    token?: string;
};

const StudentPortalPage = ({ token }: Props) => {
    const { data: d, loading, error } = useApi<StudentPortalData>(
        token ? `/portal/${token}` : null
    );
    const [tab, setTab] = useState("lessons");

    useEffect(() => {
        if (!token || !d?.tutorSlug) return;
        setPortalTokenForTutor(d.tutorSlug, token);
    }, [token, d?.tutorSlug]);

    if (!token || loading) {
        return (
            <div className="min-h-screen bg-background dark:bg-n-2 flex items-center justify-center">
                <p className="text-sm text-n-3 dark:text-white/50">Загрузка…</p>
            </div>
        );
    }

    if (error || !d) {
        return (
            <div className="min-h-screen bg-background dark:bg-n-2 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm font-bold mb-2">Ссылка недействительна</p>
                    <p className="text-xs text-n-3 dark:text-white/50">
                        Попросите репетитора отправить актуальную ссылку
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Мои занятия — Repeto</title>
            </Head>
            <div className="min-h-screen bg-background dark:bg-n-2">
                {/* Header */}
                <div className="border-b border-n-1 bg-white dark:bg-n-1 dark:border-white">
                    <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between md:px-4">
                        <div className="text-sm font-bold">
                            Repeto
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-n-3 dark:text-white/50">
                                {d.studentName}
                            </div>
                            <ToggleTheme />
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-6 py-6 md:px-4">
                    {/* Tutor Profile Widget */}
                    <div className="mb-1 text-xs font-bold text-n-3 dark:text-white/50 uppercase tracking-wider">
                        Ваш репетитор
                    </div>
                    <div className="card mb-6">
                        <div className="p-5 flex items-start gap-4 md:flex-col">
                            <div className="relative w-12 h-12 rounded-full bg-purple-1 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                                {d.tutorAvatarUrl ? (
                                    <Image
                                        className="object-cover"
                                        src={resolveApiAssetUrl(d.tutorAvatarUrl) || d.tutorAvatarUrl}
                                        fill
                                        alt={d.tutorName}
                                    />
                                ) : (
                                    d.tutorName.split(" ").slice(0, 2).map(w => w[0]).join("")
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold mb-1">{d.tutorName}</div>
                                <div className="flex flex-wrap gap-3 text-xs text-n-3 dark:text-white/50">
                                    <a
                                        href={`tel:${d.tutorPhone.replace(/[^+\d]/g, "")}`}
                                        className="flex items-center gap-1 hover:text-purple-1 transition-colors"
                                    >
                                        {d.tutorPhone}
                                    </a>
                                    {d.tutorWhatsapp && (
                                        <a
                                            href={`https://wa.me/${d.tutorWhatsapp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-purple-1 transition-colors"
                                        >
                                            WhatsApp
                                        </a>
                                    )}
                                    <a
                                        href={`/t/${d.tutorSlug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-purple-1 transition-colors"
                                    >
                                        <Icon
                                            className="icon-12 fill-n-3 dark:fill-white/50"
                                            name="external-link"
                                        />
                                        Профиль
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 overflow-auto scrollbar-none -mx-6 px-6 md:-mx-4 md:px-4">
                        <Tabs items={tabItems} value={tab} setValue={setTab} />
                    </div>

                    {/* Tab Content */}
                    {tab === "lessons" && <LessonsTab data={d} token={token} />}
                    {tab === "homework" && <HomeworkTab homework={d.homework} token={token} />}
                    {tab === "materials" && (
                        <MaterialsTab files={d.files} homework={d.homework} />
                    )}
                    {tab === "payment" && <PaymentTab data={d} />}

                    <SignUpBanner notifications={d.notifications} />

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-n-3 dark:text-white/50">
                        Работает на{" "}
                        <Link href="/" className="font-bold hover:text-purple-1 transition-colors">
                            Repeto
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentPortalPage;
