import Link from "next/link";
import Image from "@/components/Image";

type RowProps = {
    item: any;
};

const Row = ({ item }: RowProps) => {
    return (
        <tr className="">
            <td className="td-custom md:!pl-4">
                <Link
                    className="flex items-center transition-colors hover:text-purple-1"
                    href="/finance/crypto-assets-details"
                >
                    <div className="w-6 mr-3 p-0.25 rounded-full text-0 dark:bg-white">
                        <Image
                            className="w-full"
                            src={item.currencyLogo}
                            width={24}
                            height={24}
                            alt={item.currencyTitle}
                        />
                    </div>
                    <div className="mr-1 font-bold">{item.currencyTitle}</div>
                    <div className="font-medium text-n-3 dark:text-white/75">
                        {item.currencyInfo}
                    </div>
                </Link>
            </td>
            <td className="td-custom text-right md:hidden">${item.volume}</td>
            <td className="td-custom text-right md:hidden">
                ${item.marketCap}
            </td>
            <td className="td-custom text-right font-bold md:!pl-0">
                ${item.price}
            </td>
            <td
                className={`td-custom text-right font-bold md:!pl-0 ${
                    item.change > 0 ? "text-green-1" : "text-pink-1"
                }`}
            >
                {item.change > 0 ? "+" + item.change : item.change}%
            </td>
            <td className="td-custom text-right lg:hidden">
                <button className="btn-stroke btn-small">Trade</button>
            </td>
        </tr>
    );
};

export default Row;
