import Image from "@/components/Image";

import { accounts } from "@/mocks/finance";

type AssetsProps = {};

const Assets = ({}: AssetsProps) => (
    <div className="card">
        <div className="py-5 px-4 pb-2 lg:flex lg:justify-between md:block">
            <div className="mb-3.5 lg:mb-0 md:mb-3">
                <div className="text-h4">$441 339,29 Usd</div>
                <div className="text-sm font-medium text-n-3 dark:text-white/50">
                    From all accounts in total
                </div>
            </div>
            <button className="btn-stroke btn-small px-5">Manage assets</button>
        </div>
        <div>
            {accounts.map((item) => (
                <div
                    className="flex items-center px-4 pt-4.5 pb-5 border-b border-n-1 text-sm last:border-none dark:border-white"
                    key={item.id}
                >
                    <div className="flex items-center grow text-sm">
                        <div className="w-6 mr-3 md:mr-2 text-0 rounded-full dark:bg-white">
                            <Image
                                className="w-full"
                                src={item.currencyLogo}
                                width={24}
                                height={24}
                                alt={item.currencyTitle}
                            />
                        </div>
                        <div className="mr-1 font-bold">
                            {item.currencyTitle}
                        </div>
                        <div
                            className={`flex items-center ml-1.5 text-sm font-bold md:ml-1 ${
                                item.progress > 0
                                    ? "text-green-1"
                                    : "text-pink-1"
                            }`}
                        >
                            {item.progress > 0
                                ? "+" + item.progress
                                : item.progress}
                            %
                        </div>
                    </div>
                    <div className="w-32 text-right md:w-auto md:mr-2">
                        ${item.price}
                    </div>
                    <div className="w-32 text-right font-bold md:w-auto">
                        {item.crypto}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default Assets;
