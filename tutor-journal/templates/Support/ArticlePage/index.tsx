import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Article from "@/components/Article";
import Breadcrumbs from "@/components/Breadcrumbs";
import Image from "@/components/Image";

import {
    topCommunityPosts,
    menuArticles,
    articles,
    getArticleVisuals,
} from "@/mocks/support";

const ArticlePage = () => {
    const router = useRouter();
    const articleId = (router.query.id as string) || "start-1";

    const article = articles.find((a) => a.id === articleId) || articles[0];
    const articleVisuals = getArticleVisuals(article);

    const breadcrumbs = [
        {
            title: "Поддержка",
            url: "/support",
        },
        {
            title: article.category,
            url: "/support/categories",
        },
        {
            title: article.title,
        },
    ];

    // Filter related articles (same category, different id)
    const relatedArticles = articles
        .filter((a) => a.categoryId === article.categoryId && a.id !== article.id)
        .slice(0, 3);

    const handleMenuClick = (menuItem: { id: string; title: string }) => {
        const firstArticle = articles.find((a) => a.categoryId === menuItem.id);
        if (firstArticle) {
            router.push(`/support/article?id=${firstArticle.id}`);
        }
    };

    return (
        <Layout title="Поддержка">
            <div className="flex lg:block">
                <div className="grow">
                    <Breadcrumbs items={breadcrumbs} />
                    <div className="mb-8 text-h1 lg:mb-5 lg:text-h2">
                        {article.title}
                    </div>
                    <div className="mb-6 pt-5 px-5 pb-7 card md:p-0 md:border-none md:bg-transparent dark:md:bg-transparent">
                        <p className="mb-5">{article.intro}</p>
                        <ol className="list-decimal mb-5 pl-10 pr-5 py-4 border border-dashed border-n-1 text-sm font-bold dark:border-white">
                            {article.steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ol>
                        {article.note && (
                            <p className="text-sm font-medium text-n-3 dark:text-white/50">
                                Примечание: {article.note}
                            </p>
                        )}
                        {articleVisuals.length > 0 && (
                            <div className="mt-6">
                                <div className="mb-3 text-sm font-bold">
                                    Скриншоты интерфейса
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                                    {articleVisuals.map((visual) => (
                                        <div
                                            className="p-3 border border-dashed border-n-1 dark:border-white"
                                            key={visual.src}
                                        >
                                            <div className="overflow-hidden border border-n-1 dark:border-white">
                                                <Image
                                                    className="w-full h-auto"
                                                    src={visual.src}
                                                    width={1280}
                                                    height={760}
                                                    alt={visual.alt}
                                                />
                                            </div>
                                            <div className="mt-2 text-xs text-n-3 dark:text-white/70">
                                                {visual.caption}
                                            </div>
                                            {visual.href && (
                                                <button
                                                    className="mt-2 text-xs font-bold text-purple-1 transition-colors hover:text-purple-1/75"
                                                    onClick={() =>
                                                        router.push(visual.href as string)
                                                    }
                                                    type="button"
                                                >
                                                    Открыть раздел
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {relatedArticles.length > 0 && (
                        <>
                            <div className="mb-5 text-sm font-bold">
                                Также может быть полезно
                            </div>
                            <div className="">
                                {relatedArticles.map((a) => (
                                    <Article
                                        className="-mt-0.25 !border-n-1 dark:!border-white"
                                        classIcon="xl:hidden"
                                        item={{
                                            id: a.id,
                                            icon: topCommunityPosts[0]?.icon || "/images/bag.svg",
                                            title: a.title,
                                            content: a.intro,
                                        }}
                                        key={a.id}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className="flex flex-col items-start shrink-0 w-[19rem] ml-12 pt-10 4xl:w-[13rem] lg:hidden">
                    {menuArticles.map((button) => (
                        <button
                            className={`mb-5 text-sm font-bold transition-colors hover:text-purple-1 last:mb-0 ${
                                article.categoryId === button.id
                                    ? "text-purple-1"
                                    : ""
                            }`}
                            key={button.id}
                            onClick={() => handleMenuClick(button)}
                        >
                            {button.title}
                        </button>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default ArticlePage;
