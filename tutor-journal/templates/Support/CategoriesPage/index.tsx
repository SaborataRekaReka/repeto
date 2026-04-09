import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Search from "@/components/Search";
import Article from "@/components/Article";
import Breadcrumbs from "@/components/Breadcrumbs";
import Category from "./Category";

import { productCategories, topCommunityPosts } from "@/mocks/support";

const CategoriesPage = () => {
    const router = useRouter();
    const [search, setSearch] = useState<string>("");

    const handleSearch = (e: any) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/support/search-result?q=${encodeURIComponent(search.trim())}`);
        }
    };

    const breadcrumbs = [
        { title: "Поддержка", url: "/support" },
        { title: "Категории" },
    ];

    return (
        <Layout title="Поддержка">
            <Breadcrumbs items={breadcrumbs} />
            <div className="max-w-[41.25rem] w-full mx-auto mb-18 pt-12 md:mb-10 md:pt-6">
                <div className="mb-6 text-center text-h1 md:text-h3">
                    Категории
                </div>
                <Search
                    className="mb-3.5"
                    placeholder="Поиск по статьям"
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    onSubmit={handleSearch}
                    large
                />
                <div className="text-center text-sm text-n-3">
                    Например <strong>Как добавить ученика</strong>
                </div>
            </div>
            <div className="flex flex-wrap -mt-2.5 -mx-2.5 mb-8 lg:block lg:mx-0">
                {productCategories.map((category) => (
                    <Category item={category} key={category.id} />
                ))}
            </div>
            <div className="mb-5 text-sm font-bold">Полезные статьи</div>
            <div className="">
                {topCommunityPosts.map((article) => (
                    <Article
                        className="-mt-0.25 !border-n-1 dark:!border-white"
                        classIcon="lg:hidden"
                        item={article}
                        key={article.id}
                    />
                ))}
            </div>
        </Layout>
    );
};

export default CategoriesPage;
