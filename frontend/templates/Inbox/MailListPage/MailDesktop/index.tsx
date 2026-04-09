import { useState } from "react";
import Link from "next/link";
import Checkbox from "@/components/Checkbox";
import Icon from "@/components/Icon";
import Image from "@/components/Image";

type MailDesktopProps = {
    item: any;
};

const MailDesktop = ({ item }: MailDesktopProps) => {
    const [value, setValue] = useState<boolean>(item.isChecked);

    return (
        <div className="flex items-start p-4 border-b border-n-1 text-sm last:border-none dark:border-white">
            <Checkbox
                className="shrink-0 mt-1.5 mr-4"
                value={value}
                onChange={() => setValue(!value)}
            />
            <Icon
                className={`shrink-0 icon-18 mt-2 mr-4 ${
                    item.marker ? "fill-yellow-1" : "fill-n-1 dark:fill-white"
                }`}
                name={item.marker ? "marker-fill" : "marker"}
            />
            <div className="flex items-center shrink-0 pr-4 font-bold w-[14.7rem]">
                <div className="relative shrink-0 w-8 h-8 mr-3">
                    <Image
                        className="object-cover rounded-full"
                        src={item.avatar}
                        fill
                        alt="Avatar"
                    />
                </div>
                {item.name}
            </div>
            <Link className="grow pt-1.5 truncate" href="/inbox/mail-compose">
                {item.content}{" "}
                <span className="text-n-3 dark:text-white/75">
                    {item.theme}
                </span>
                {item.files && (
                    <div className="flex flex-wrap -ml-4 mt-0.5">
                        {item.files.map((file: any, index: number) => (
                            <div
                                className="flex items-center ml-4 mt-2 text-xs font-bold"
                                key={index}
                            >
                                <div
                                    className={`w-2 h-2 mr-1.5 rounded-full ${
                                        file.type === "sketch"
                                            ? "bg-yellow-1"
                                            : file.type === "pdf"
                                            ? "bg-pink-1"
                                            : file.type === "docx"
                                            ? "bg-purple-1"
                                            : "bg-green-1"
                                    }`}
                                ></div>
                                {file.name}
                            </div>
                        ))}
                    </div>
                )}
            </Link>
            <div className="shrink-0 w-28 ml-4 pt-1.5 text-right font-medium">
                {item.time}
            </div>
            <button className="btn-transparent-dark btn-small btn-square shrink-0 ml-6">
                <Icon name="dots" />
            </button>
        </div>
    );
};

export default MailDesktop;
