import Link from "next/link";
import Image from "@/components/Image";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => (
    <Link
        className="flex items-center p-4 border-b border-n-1 text-sm last:border-none dark:border-white"
        href="/crm/product-details"
    >
        <div className="shrink-0 w-[4.25rem] border border-n-1">
            <Image
                className="w-full"
                src={item.image}
                width={74}
                height={74}
                alt=""
            />
        </div>
        <div className="w-[calc(100%-4.25rem)] pl-5">
            <div className="truncate font-bold">{item.title}</div>
            <div className="mb-2 truncate text-n-3 dark:text-white/75">
                {item.details}
            </div>
            <div className="flex justify-between items-center">
                <div className="inline-flex items-center shrink-0">
                    {item.stock}
                    <div
                        className="relative w-14 h-1.5 ml-3"
                        style={{
                            backgroundColor: item.progressColor || "#98E9AB",
                        }}
                    >
                        <div
                            className="absolute top-0 left-0 bottom-0 bg-n-1/30"
                            style={{
                                width: item.progressValue + "%",
                            }}
                        ></div>
                    </div>
                </div>
                <div className="font-bold">${item.price}</div>
            </div>
        </div>
    </Link>
);

export default Item;
