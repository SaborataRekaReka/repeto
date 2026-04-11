import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import GravityLayout from "@/components/GravityLayout";
import { Text, TextInput, Icon } from "@gravity-ui/uikit";
import { Magnifier } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import Post from "./Post";
import { articles } from "@/mocks/support";

const SearchResultPage = () => {
    const router = useRouter();
    const queryParam = (router.query.q as string) || "";
    const [search, setSearch] = useState("");

    useEffect(() => { if (queryParam) setSearch(queryParam); }, [queryParam]);

    const handleSearch = () => {
        if (search.trim()) router.push(`/support/search-result?q=${encodeURIComponent(search.trim())}`);
    };

    const results = useMemo(() => {
        if (!queryParam) return [];
        const q = queryParam.toLowerCase();
        return articles.filter(
            (a) => a.title.toLowerCase().includes(q) || a.intro.toLowerCase().includes(q) ||
                   a.category.toLowerCase().includes(q) || a.steps.some((s) => s.toLowerCase().includes(q))
        );
    }, [queryParam]);

    return (
        <GravityLayout title="Поддержка">
            {/* Breadcrumbs */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <Link href="/support" style={{ fontSize: 13, color: "var(--g-color-text-brand)", textDecoration: "none", fontWeight: 500 }}>Поддержка</Link>
                <Text variant="caption-2" color="secondary">›</Text>
                <Text variant="caption-2" color="secondary">{queryParam ? `Поиск: ${queryParam}` : "Поиск"}</Text>
            </div>

            {/* Hero */}
            <div style={{ maxWidth: 660, margin: "0 auto", padding: "32px 0 40px", textAlign: "center" }}>
                <Text variant="display-1" style={{ display: "block", marginBottom: 24 }}>Результаты поиска</Text>
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
            </div>

            {results.length > 0 ? (
                <>
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 12 }}>
                        Найдено статей: {results.length}
                    </Text>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {results.map((post) => (
                            <Post item={{ id: post.id, title: post.title, content: post.intro }} key={post.id} />
                        ))}
                    </div>
                </>
            ) : queryParam ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16, margin: "0 auto 16px",
                        background: "rgba(174,122,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Icon data={Magnifier as IconData} size={28} style={{ color: "var(--g-color-text-secondary)" }} />
                    </div>
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 8 }}>Ничего не найдено</Text>
                    <Text variant="body-1" color="secondary">
                        Попробуйте другой запрос или посмотрите{" "}
                        <Link href="/support/categories" style={{ color: "var(--g-color-text-brand)", fontWeight: 600, textDecoration: "none" }}>все категории</Link>
                    </Text>
                </div>
            ) : null}
        </GravityLayout>
    );
};

export default SearchResultPage;
