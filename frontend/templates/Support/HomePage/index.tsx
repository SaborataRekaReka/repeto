import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Search from "@/components/Search";
import Article from "@/components/Article";
import Post from "./Post";
import Link from "next/link";

import { products, popularArticles } from "@/mocks/support";

const HomePage = () => {
    const router = useRouter();
    const [search, setSearch] = useState<string>("");

    const handleSearch = (e: any) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/support/search-result?q=${encodeURIComponent(search.trim())}`);
        }
    };

    return (
        <Layout title="Поддержка" background>
            <div className="max-w-[41.25rem] w-full mx-auto mb-18 pt-12 md:mb-10 md:pt-6">
                <div className="mb-6 text-center text-h1 md:text-h3">
                    Чем можем помочь?
                </div>
                <Search
                    className="mb-3.5"
                    placeholder="Поиск по статьям"
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    onSubmit={handleSearch}
                    large
                />
                <div className="text-center">
                    Например <strong>Как добавить ученика</strong>
                </div>
            </div>
            <div className="mb-5 text-sm font-bold">Разделы</div>
            <div className="flex flex-wrap -mt-2.5 -mx-2.5 mb-8 md:block md:mx-0">
                {products.map((article) => (
                    <Article
                        className="w-[calc(33.333%-1.25rem)] mt-2.5 mx-2.5 2xl:w-[calc(50%-1.25rem)] md:w-full md:mx-0"
                        item={article}
                        key={article.id}
                    />
                ))}
            </div>
            <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-bold">Популярные статьи</div>
                <Link
                    className="text-xs font-bold text-purple-1 transition-colors hover:text-purple-2"
                    href="/support/categories"
                >
                    Все категории →
                </Link>
            </div>
            <div className="flex flex-wrap -mt-2.5 -mx-2.5 lg:block lg:mx-0">
                {popularArticles.map((article) => (
                    <Post item={article} key={article.id} />
                ))}
            </div>
        </Layout>
    );
};

export default HomePage;
