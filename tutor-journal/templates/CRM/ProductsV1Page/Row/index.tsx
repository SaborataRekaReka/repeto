import Link from "next/link";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

type RowProps = {
    item: any;
};

const Row = ({ item }: RowProps) => {
    return (
        <tr className="">
            <td className="td-custom py-3.5">
                <Link
                    className="inline-flex items-center text-sm font-bold transition-colors hover:text-purple-1"
                    href="/crm/product-details"
                >
                    <div className="shrink-0 w-18 mr-5 border border-n-1">
                        <Image
                            className="w-full"
                            src={item.image}
                            width={74}
                            height={74}
                            alt=""
                        />
                    </div>
                    {item.title}
                </Link>
            </td>
            <td className="td-custom py-3.5 text-n-3 4xl:max-w-[17.5rem] dark:text-white/75">
                {item.details}
            </td>
            <td className="td-custom py-3.5 text-right font-medium">
                {item.sold}
            </td>
            <td className="td-custom py-3.5 font-medium">
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
            </td>
            <td className="td-custom py-3.5 text-right font-bold">
                ${item.price}
            </td>
            <td className="td-custom py-3.5 text-right">
                <button className="btn-stroke btn-small btn-square">
                    <Icon name="dots" />
                </button>
            </td>
        </tr>
    );
};

export default Row;
