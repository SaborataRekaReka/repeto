import Icon from "@/components/Icon";
import Image from "@/components/Image";

import { latestTransactions } from "@/mocks/finance";

type LatestTransactionsProps = {};

const LatestTransactions = ({}: LatestTransactionsProps) => (
    <div className="card">
        <div className="card-head px-4">
            <div className="text-h6">Latest transactions</div>
            <button className="group">
                <Icon
                    className="icon-18 transition-colors dark:fill-white group-hover:fill-purple-1"
                    name="chart"
                />
            </button>
        </div>
        <table className="w-full text-sm">
            <tbody>
                {latestTransactions.map((row) => (
                    <tr
                        className="border-b border-n-1 last:border-none dark:border-white"
                        key={row.id}
                    >
                        <td className="pl-4 pt-4.5 pb-5">
                            <div className="flex items-center">
                                <div className="w-6 mr-3 text-0 rounded-full dark:bg-white">
                                    <Image
                                        className="w-full"
                                        src={row.logo}
                                        width={24}
                                        height={24}
                                        alt=""
                                    />
                                </div>
                                <div className="mr-1 font-bold">
                                    {row.title}
                                </div>
                            </div>
                        </td>
                        <td className="pl-4 pt-4.5 pb-5 text-right 2xl:hidden">
                            {row.time}
                        </td>
                        <td className="pl-4 pt-4.5 pb-5 text-right md:hidden">
                            ${row.price}
                        </td>
                        <td className="px-4 pt-4.5 pb-5 text-right font-bold">
                            {row.crypto}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default LatestTransactions;
