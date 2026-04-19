import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import GravityLayout from "@/components/GravityLayout";
import { Card, Text, TextInput, Icon } from "@gravity-ui/uikit";
import { Magnifier, CircleInfo, Person, Clock, CreditCard, FileText, PersonPlus } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import Post from "./Post";
import { products, popularArticles } from "@/mocks/support";

const sectionIcons: Record<string, { icon: unknown; bg: string; color: string }> = {
    "start-1": { icon: CircleInfo, bg: "rgba(66,133,244,0.08)", color: "#4285F4" },
    "students-1": { icon: Person, bg: "rgba(174,122,255,0.08)", color: "var(--g-color-text-brand)" },
    "schedule-1": { icon: Clock, bg: "rgba(52,168,83,0.08)", color: "#34A853" },
    "finance-1": { icon: CreditCard, bg: "rgba(251,188,5,0.1)", color: "#E8A000" },
    "public-1": { icon: FileText, bg: "rgba(234,67,53,0.08)", color: "#EA4335" },
    "portal-1": { icon: PersonPlus, bg: "rgba(0,188,212,0.08)", color: "#00897B" },
};

const HomePage = () => {
    const router = useRouter();
    const [search, setSearch] = useState("");

    const handleSearch = () => {
        if (search.trim()) router.push(`/support/search-result?q=${encodeURIComponent(search.trim())}`);
    };

    return (
        <GravityLayout title="Поддержка">
            {/* Hero */}
            <div style={{ maxWidth: 660, margin: "0 auto", padding: "48px 0 40px", textAlign: "center" }}>
                <Text variant="display-1" style={{ display: "block", marginBottom: 24 }}>
                    Чем можем помочь?
                </Text>
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                    <TextInput
                        size="xl"
                        value={search}
                        onUpdate={setSearch}
                        placeholder="Поиск по статьям..."
                        startContent={
                            <Icon
                                data={Magnifier as IconData}
                                size={18}
                                style={{
                                    color: "var(--g-color-text-secondary)",
                                    marginLeft: 4,
                                    marginRight: 2,
                                }}
                            />
                        }
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                    />
                </form>
                <Text variant="body-1" color="secondary" style={{ display: "block", marginTop: 12 }}>
                    Например <strong>Как добавить ученика</strong>
                </Text>
            </div>

            {/* Sections */}
            <Text variant="subheader-2" style={{ display: "block", marginBottom: 16 }}>Разделы</Text>
            <div className="repeto-support-grid-3" style={{ marginBottom: 40 }}>
                {products.map((item) => {
                    const si = sectionIcons[item.id] || sectionIcons["start-1"];
                    return (
                        <Link key={item.id} href={`/support/article?id=${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            <Card view="outlined" style={{
                                padding: 20, background: "var(--g-color-base-float)", cursor: "pointer",
                                transition: "box-shadow 0.15s, border-color 0.15s",
                                height: "100%",
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                                    background: si.bg, display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Icon data={si.icon as IconData} size={20} style={{ color: si.color }} />
                                </div>
                                <Text variant="body-1" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>{item.title}</Text>
                                <Text variant="caption-2" color="secondary">{item.content}</Text>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Popular articles */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Text variant="subheader-2">Популярные статьи</Text>
                <Link href="/support/categories" style={{
                    fontSize: 13, fontWeight: 600, color: "var(--g-color-text-brand)", textDecoration: "none",
                }}>
                    Все категории →
                </Link>
            </div>
            <div className="repeto-support-grid-3">
                {popularArticles.map((article) => (
                    <Post item={article} key={article.id} />
                ))}
            </div>
        </GravityLayout>
    );
};

export default HomePage;
