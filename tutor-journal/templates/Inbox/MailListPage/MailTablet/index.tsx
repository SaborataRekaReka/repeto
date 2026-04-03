import Link from "next/link";
import Icon from "@/components/Icon";
import Image from "@/components/Image";

type MailTabletProps = {
    item: any;
};

const MailTablet = ({ item }: MailTabletProps) => {
    return (
        <Link
            className="block px-5 py-3.5 border-b border-n-1 text-sm last:border-none dark:border-white"
            href="/inbox/mail-compose"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center font-bold">
                    <div className="relative shrink-0 w-7 h-7 mr-3">
                        <Image
                            className="object-cover rounded-full"
                            src={item.avatar}
                            fill
                            alt="Avatar"
                        />
                    </div>
                    {item.name}
                </div>
                <div className="text-xs font-medium">{item.time}</div>
            </div>
            <div className="flex">
                <Icon
                    className={`shrink-0 icon-18 mr-4 ${
                        item.marker
                            ? "fill-yellow-1"
                            : "fill-n-1 dark:fill-white"
                    }`}
                    name={item.marker ? "marker-fill" : "marker"}
                />
                <div className="truncate">
                    {item.content}{" "}
                    <span className="text-n-3 dark:text-white/75">
                        {item.theme}
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default MailTablet;
