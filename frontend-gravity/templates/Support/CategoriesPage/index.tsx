import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import GravityLayout from "@/components/GravityLayout";
import { Card, Text, TextInput, Icon } from "@gravity-ui/uikit";
import { Magnifier } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import Category from "./Category";
import { productCategories, topCommunityPosts } from "@/mocks/support";

const CategoriesPage = () => {
    const router = useRouter();
    const [search, setSearch] = useState("");

    const handleSearch = () => {
        if (search.trim()) router.push(`/support/search-result?q=${encodeURIComponent(search.trim())}`);
    };

    return (
        <GravityLayout title="Поддержка">
            {/* Breadcrumbs */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <Link href="/support" style={{ fontSize: 13, color: "var(--g-color-text-brand)", textDecoration: "none", fontWeight: 500 }}>Поддержка</Link>
                <Text variant="caption-2" color="secondary">›</Text>
                <Text variant="caption-2" color="secondary">Категории</Text>
            </div>

            {/* Hero */}
            <div style={{ maxWidth: 660, margin: "0 auto", padding: "32px 0 40px", textAlign: "center" }}>
                <Text variant="display-1" style={{ display: "block", marginBottom: 24 }}>Категории</Text>
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                    <TextInput
                        size="xl"
                        value={search}
                        onUpdate={setSearch}
                        placeholder="Поиск по статьям..."
                        startContent={<Icon data={Magnifier as IconData} size={18} />}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                    />
                </form>
                <Text variant="body-1" color="secondary" style={{ display: "block", marginTop: 12 }}>
                    Например <strong>Как добавить ученика</strong>
                </Text>
            </div>

            {/* Categories grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 40 }}>
                {productCategories.map((cat: any) => (
                    <Category item={cat} key={cat.id} />
                ))}
            </div>

            {/* Useful articles */}
            <Text variant="subheader-2" style={{ display: "block", marginBottom: 12 }}>Полезные статьи</Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topCommunityPosts.map((a: any) => (
                    <Link key={a.id} href={a.id ? `/support/article?id=${a.id}` : "/support/article"} style={{ textDecoration: "none", color: "inherit" }}>
                        <Card view="outlined" style={{ padding: "14px 20px", background: "var(--g-color-base-float)", cursor: "pointer", transition: "border-color 0.15s" }}>
                            <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>{a.title}</Text>
                            {a.content && <Text variant="caption-2" color="secondary">{a.content}</Text>}
                            {a.date && (
                                <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>
                                    {a.date}{a.category && <> · {a.category}</>}
                                </Text>
                            )}
                        </Card>
                    </Link>
                ))}
            </div>
        </GravityLayout>
    );
};

export default CategoriesPage;
