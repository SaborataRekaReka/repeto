import { useRouter } from "next/router";
import Link from "next/link";
import GravityLayout from "@/components/GravityLayout";
import { Card, Text } from "@gravity-ui/uikit";
import { topCommunityPosts, menuArticles, articles, getArticleVisuals } from "@/mocks/support";

const ArticlePage = () => {
    const router = useRouter();
    const articleId = (router.query.id as string) || "start-1";
    const article = articles.find((a) => a.id === articleId) || articles[0];
    const articleVisuals = getArticleVisuals(article);

    const relatedArticles = articles
        .filter((a) => a.categoryId === article.categoryId && a.id !== article.id)
        .slice(0, 3);

    const handleMenuClick = (menuItem: { id: string; title: string }) => {
        const firstArticle = articles.find((a) => a.categoryId === menuItem.id);
        if (firstArticle) router.push(`/support/article?id=${firstArticle.id}`);
    };

    return (
        <GravityLayout title="Поддержка">
            {/* Breadcrumbs */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                <Link href="/support" style={{ fontSize: 13, color: "var(--g-color-text-brand)", textDecoration: "none", fontWeight: 500 }}>Поддержка</Link>
                <Text variant="caption-2" color="secondary">›</Text>
                <Link href="/support/categories" style={{ fontSize: 13, color: "var(--g-color-text-brand)", textDecoration: "none", fontWeight: 500 }}>{article.category}</Link>
                <Text variant="caption-2" color="secondary">›</Text>
                <Text variant="caption-2" color="secondary">{article.title}</Text>
            </div>

            <div className="repeto-support-article-layout">
                {/* Main */}
                <div className="repeto-support-article-main">
                    <Text variant="display-1" style={{ display: "block", marginBottom: 28 }}>{article.title}</Text>

                    <Card view="outlined" style={{ padding: 24, background: "var(--g-color-base-float)", marginBottom: 32 }}>
                        <Text variant="body-1" style={{ display: "block", marginBottom: 20, lineHeight: 1.7 }}>{article.intro}</Text>

                        <div style={{
                            padding: "16px 20px 16px 12px", borderRadius: 12,
                            border: "1px dashed var(--g-color-line-generic)", marginBottom: 20,
                        }}>
                            <ol style={{ margin: 0, paddingLeft: 28, display: "flex", flexDirection: "column", gap: 8 }}>
                                {article.steps.map((step: string, i: number) => (
                                    <li key={i} style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>{step}</li>
                                ))}
                            </ol>
                        </div>

                        {article.note && (
                            <div style={{
                                padding: "12px 16px", borderRadius: 10,
                                background: "rgba(174,122,255,0.04)", borderLeft: "3px solid var(--g-color-text-brand)",
                            }}>
                                <Text variant="caption-2" color="secondary" style={{ fontWeight: 500 }}>
                                    Примечание: {article.note}
                                </Text>
                            </div>
                        )}

                        {articleVisuals.length > 0 && (
                            <div style={{ marginTop: 24 }}>
                                <Text variant="subheader-2" style={{ display: "block", marginBottom: 12 }}>Скриншоты интерфейса</Text>
                                <div className="repeto-support-article-visuals">
                                    {articleVisuals.map((visual: any) => (
                                        <div key={visual.src} style={{
                                            borderRadius: 10, border: "1px dashed var(--g-color-line-generic)",
                                            padding: 12, overflow: "hidden",
                                        }}>
                                            <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--g-color-line-generic)" }}>
                                                <img src={visual.src} alt={visual.alt} style={{ width: "100%", height: "auto", display: "block" }} />
                                            </div>
                                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 8 }}>{visual.caption}</Text>
                                            {visual.href && (
                                                <button
                                                    onClick={() => router.push(visual.href)}
                                                    style={{
                                                        marginTop: 6, fontSize: 12, fontWeight: 600, color: "var(--g-color-text-brand)",
                                                        background: "none", border: "none", cursor: "pointer", padding: 0,
                                                    }}
                                                >Открыть раздел</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {relatedArticles.length > 0 && (
                        <>
                            <Text variant="subheader-2" style={{ display: "block", marginBottom: 12 }}>Также может быть полезно</Text>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {relatedArticles.map((a) => (
                                    <Link key={a.id} href={`/support/article?id=${a.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                        <Card view="outlined" style={{
                                            padding: "14px 20px", background: "var(--g-color-base-float)", cursor: "pointer",
                                            transition: "border-color 0.15s",
                                        }}>
                                            <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>{a.title}</Text>
                                            <Text variant="caption-2" color="secondary">{a.intro}</Text>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="repeto-support-article-sidebar">
                    <Text variant="subheader-2" style={{ display: "block", marginBottom: 12, paddingTop: 8 }}>Категории</Text>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {menuArticles.map((btn: any) => (
                            <button
                                key={btn.id}
                                onClick={() => handleMenuClick(btn)}
                                style={{
                                    display: "block", width: "100%", textAlign: "left",
                                    padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                                    fontSize: 13, fontWeight: article.categoryId === btn.id ? 600 : 400,
                                    background: article.categoryId === btn.id ? "rgba(174,122,255,0.08)" : "transparent",
                                    color: article.categoryId === btn.id ? "var(--g-color-text-brand)" : "var(--g-color-text-primary)",
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => { if (article.categoryId !== btn.id) e.currentTarget.style.background = "var(--g-color-base-simple-hover)"; }}
                                onMouseLeave={(e) => { if (article.categoryId !== btn.id) e.currentTarget.style.background = "transparent"; }}
                            >
                                {btn.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </GravityLayout>
    );
};

export default ArticlePage;
