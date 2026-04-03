import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import Checkbox from "@/components/Checkbox";
import Users from "@/components/Users";
import TablePagination from "@/components/TablePagination";

import { files } from "@/mocks/projects";

const FileManagerFilesPage = () => {
    const [value, setValue] = useState<boolean>();
    return (
        <Layout title="File Manager  /  Recent Uploads">
            <div className="">
                <div className="flex justify-between mb-6 md:mb-5">
                    <button className="btn-stroke btn-small">
                        <Icon name="add-folder" />
                        <span>Add New Folder</span>
                    </button>
                    <button className="btn-stroke btn-small">
                        <Icon name="upload" />
                        <span>Upload New File</span>
                    </button>
                </div>
                <div className="card">
                    {files.map((file: any) => (
                        <div
                            className="flex items-center border-t border-n-1 px-4 py-5 first:border-none md:py-4 dark:border-white"
                            key={file.id}
                        >
                            <Checkbox
                                className="shrink-0 mr-3.5 md:hidden"
                                value={value}
                                onChange={() => setValue(!value)}
                            />
                            <Link
                                className="grow flex items-center pr-6 text-sm font-bold cursor-pointer transition-colors hover:text-purple-1"
                                href="/projects/file-manager-details"
                            >
                                <div className="flex justify-center items-center w-8 h-8 mr-3.5 p-1.5 bg-background">
                                    <Image
                                        className="w-full"
                                        src={file.logo}
                                        width={20}
                                        height={20}
                                        alt="File"
                                    />
                                </div>
                                {file.title}
                            </Link>
                            <div className="shrink-0 w-36 text-xs font-medium lg:w-24 md:hidden">
                                {file.size}
                            </div>
                            <div className="shrink-0 w-36 text-xs font-medium lg:hidden">
                                {file.date}
                            </div>
                            <Users
                                className="shrink-0 w-28 lg:hidden"
                                items={file.users}
                                large
                                border
                            />
                            <button className="btn-transparent-dark btn-small btn-square shrink-0 ml-4 md:hidden">
                                <Icon name="dots" />
                            </button>
                        </div>
                    ))}
                </div>
                <TablePagination />
            </div>
        </Layout>
    );
};

export default FileManagerFilesPage;
