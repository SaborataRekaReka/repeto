import { useState } from "react";
import Layout from "@/components/Layout";
import Search from "@/components/Search";
import TablePagination from "@/components/TablePagination";
import Courses from "./Courses";
import Course from "./Course";

import { courses1, courses2 } from "@/mocks/education";

const CoursesV1Page = () => {
    const [search, setSearch] = useState<string>("");

    return (
        <Layout title="Courses" background>
            <div className="pt-12 md:pt-6">
                <div className="mb-6 text-center text-h1 md:text-h2">
                    Explore Topics and Skills
                </div>
                <Search
                    className="max-w-[41.25rem] mx-auto mb-6"
                    placeholder="What do you want to learn?"
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    onSubmit={() => console.log("Submit")}
                    large
                />
                <div className="mb-18 text-center text-sm md:mb-10">
                    For example <strong>UI and UX development</strong>
                </div>
            </div>
            <div className="mb-8">
                <div className="mb-5 text-sm font-bold md:mb-4">
                    Trending today
                </div>
                <Courses items={courses1} />
            </div>
            <div className="">
                <div className="mb-5 text-sm font-bold md:mb-4">
                    Trending today
                </div>
                <div className="flex flex-wrap -mt-5 -mx-2.5">
                    {courses2.map((course) => (
                        <Course item={course} key={course.id} />
                    ))}
                </div>
            </div>
            <TablePagination />
        </Layout>
    );
};

export default CoursesV1Page;
