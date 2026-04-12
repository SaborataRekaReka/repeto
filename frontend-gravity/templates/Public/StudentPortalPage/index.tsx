import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
    Card,
    Text,
    Avatar,
    Button,
    Icon,
    SegmentedRadioGroup,
} from "@gravity-ui/uikit";
import { ArrowUpRightFromSquare } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useApi } from "@/hooks/useApi";
import type { StudentPortalData } from "@/types/student-portal";
import LessonsTab from "./LessonsTab";
import HomeworkTab from "./HomeworkTab";
import MaterialsTab from "./MaterialsTab";
import PaymentTab from "./PaymentTab";
import SignUpBanner from "./SignUpBanner";

import Image from "next/image";
import ToggleTheme from "@/components/Footer/ToggleTheme";
import { resolveApiAssetUrl } from "@/lib/api";
import { setPortalTokenForTutor } from "@/lib/portalTokenStore";

const tabItems = [
    { value: "lessons", content: "Занятия" },
    { value: "homework", content: "Домашка" },
    { value: "materials", content: "Материалы" },
    { value: "payment", content: "Оплата" },
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
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Text variant="body-1" color="secondary">Загрузка…</Text>
            </div>
        );
    }

    if (error || !d) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <Text variant="subheader-2" as="div" style={{ marginBottom: 8 }}>Ссылка недействительна</Text>
                    <Text variant="body-1" color="secondary">
                        Попросите репетитора отправить актуальную ссылку
                    </Text>
                </div>
            </div>
        );
    }

    const tutorInitials = d.tutorName.split(" ").slice(0, 2).map(w => w[0]).join("");

    return (
        <>
            <Head>
                <title>Мои занятия — Repeto</title>
            </Head>
            <div style={{ minHeight: "100vh" }}>
                {/* Header */}
                <div style={{ borderBottom: "1px solid var(--g-color-line-generic)", background: "var(--g-color-base-float)" }}>
                    <div className="repeto-portal-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px" }}>
                        <Text variant="subheader-2">Repeto</Text>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Text variant="body-1" color="secondary">{d.studentName}</Text>
                            <ToggleTheme />
                        </div>
                    </div>
                </div>

                <div className="repeto-portal-container" style={{ padding: "24px 24px 32px" }}>
                    {/* Tutor Profile Widget */}
                    <Text variant="caption-1" color="secondary" as="div" style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                        Ваш репетитор
                    </Text>
                    <Card view="outlined" style={{ marginBottom: 24, overflow: "hidden" }}>
                        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ position: "relative", width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                                {d.tutorAvatarUrl ? (
                                    <Image
                                        style={{ objectFit: "cover" }}
                                        src={resolveApiAssetUrl(d.tutorAvatarUrl) || d.tutorAvatarUrl}
                                        fill
                                        alt={d.tutorName}
                                    />
                                ) : (
                                    <Avatar text={tutorInitials} size="l" theme="brand" style={{ "--g-avatar-size": "48px" } as React.CSSProperties} />
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text variant="subheader-2" as="div" style={{ marginBottom: 4 }}>{d.tutorName}</Text>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                                    <a href={`tel:${d.tutorPhone.replace(/[^+\d]/g, "")}`} style={{ textDecoration: "none" }}>
                                        <Text variant="caption-1" color="secondary">{d.tutorPhone}</Text>
                                    </a>
                                    {d.tutorWhatsapp && (
                                        <a href={`https://wa.me/${d.tutorWhatsapp}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                            <Text variant="caption-1" color="secondary">WhatsApp</Text>
                                        </a>
                                    )}
                                    <a href={`/t/${d.tutorSlug}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                                        <Icon data={ArrowUpRightFromSquare as IconData} size={12} />
                                        <Text variant="caption-1" color="secondary">Профиль</Text>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Tabs */}
                    <div style={{ marginBottom: 24, overflowX: "auto" }}>
                        <SegmentedRadioGroup
                            size="m"
                            value={tab}
                            onUpdate={setTab}
                            options={tabItems}
                        />
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
                    <div style={{ marginTop: 32, textAlign: "center" }}>
                        <Text variant="caption-1" color="secondary">
                            Работает на{" "}
                            <Link href="/" style={{ fontWeight: 600, textDecoration: "none", color: "inherit" }}>
                                Repeto
                            </Link>
                        </Text>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentPortalPage;
