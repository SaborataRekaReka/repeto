import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Search from "@/components/Search";
import Breadcrumbs from "@/components/Breadcrumbs";
import Post from "./Post";

import { articles } from "@/mocks/support";

const SearchResultPage = () => {
    const router = useRouter();
    const queryParam = (router.query.q as string) || "";
    const [search, setSearch] = useState<string>("");

    useEffect(() => {
        if (queryParam) setSearch(queryParam);
    }, [queryParam]);

    const handleSearch = (e: any) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/support/search-result?q=${encodeURIComponent(search.trim())}`);
        }
    };

    const results = useMemo(() => {
        if (!queryParam) return [];
        const q = queryParam.toLowerCase();
        return articles.filter(
            (a) =>
                a.title.toLowerCase().includes(q) ||
                a.intro.toLowerCase().includes(q) ||
                a.category.toLowerCase().includes(q) ||
                a.steps.some((s) => s.toLowerCase().includes(q))
        );
    }, [queryParam]);

    const breadcrumbs = [
        { title: "Поддержка", url: "/support" },
        { title: queryParam ? `Поиск: ${queryParam}` : "Поиск" },
    ];

    return (
        <Layout title="Поддержка">
            <Breadcrumbs items={breadcrumbs} />
            <div className="max-w-[41.25rem] w-full mx-auto mb-18 pt-12 md:mb-10 md:pt-6">
                <div className="mb-6 text-center text-h1 md:text-h3">
                    Результаты поиска
                </div>
                <Search
                    className="mb-3.5"
                    placeholder="Поиск по статьям"
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    onSubmit={handleSearch}
                    large
                />
            </div>
            {results.length > 0 ? (
                <>
                    <div className="mb-5 text-sm font-bold">
                        Найдено статей: {results.length}
                    </div>
                    <div className="">
                        {results.map((post) => (
                            <Post
                                item={{
                                    id: post.id,
                                    title: post.title,
                                    content: post.intro,
                                }}
                                key={post.id}
                            />
                        ))}
                    </div>
                </>
            ) : queryParam ? (
                <div className="text-center py-10">
                    <div className="mb-2 text-h5">Ничего не найдено</div>
                    <div className="text-sm text-n-3 dark:text-white/50">
                        Попробуйте другой запрос или посмотрите{" "}
                        <a
                            className="text-purple-1 hover:text-purple-2 font-bold"
                            href="/support/categories"
                        >
                            все категории
                        </a>
                    </div>
                </div>
            ) : null}
        </Layout>
    );
};

export default SearchResultPage;
