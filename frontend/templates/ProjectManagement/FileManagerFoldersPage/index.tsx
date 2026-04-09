import { useState } from "react";
import Link from "next/link";
import { useColorMode } from "@chakra-ui/color-mode";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Image from "@/components/Image";
import Checkbox from "@/components/Checkbox";

import { folders } from "@/mocks/projects";

const FileManagerFoldersPage = () => {
    const [value, setValue] = useState<boolean>();
    const { colorMode } = useColorMode();
    const isDarkMode = colorMode === "dark";

    return (
        <Layout title="File Manager">
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
                    {folders.map((folder: any) => (
                        <div
                            className="flex items-center border-t border-n-1 px-4 py-5 first:border-none md:pl-3 md:py-4 dark:border-white"
                            key={folder.id}
                        >
                            <Checkbox
                                className="shrink-0 mr-3 md:hidden"
                                value={value}
                                onChange={() => setValue(!value)}
                            />
                            <Link
                                className="grow flex items-center pr-6 text-sm font-bold cursor-pointer transition-colors hover:text-purple-1"
                                href="/projects/file-manager-files"
                            >
                                <div className="w-8 mr-2">
                                    <Image
                                        className="w-full"
                                        src={
                                            isDarkMode
                                                ? "/images/folder-light.svg"
                                                : "/images/folder-dark.svg"
                                        }
                                        width={32}
                                        height={32}
                                        alt="Folder"
                                    />
                                </div>
                                {folder.title}
                            </Link>
                            <div className="shrink-0 flex justify-end items-center mr-6 text-xs font-bold md:mr-0">
                                <Icon
                                    className="mr-1 dark:fill-white"
                                    name="file"
                                />
                                {folder.files}
                            </div>
                            <div
                                className={`shrink-0 min-w-[6rem] md:hidden ${
                                    folder.status === "Teammate"
                                        ? "label-stroke-purple"
                                        : folder.status === "Personal"
                                        ? "label-stroke-green"
                                        : "label-stroke"
                                }
                                }`}
                            >
                                {folder.status}
                            </div>
                            <button className="btn-transparent-dark btn-small btn-square shrink-0 ml-4 md:hidden">
                                <Icon name="dots" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default FileManagerFoldersPage;
