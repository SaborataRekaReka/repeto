import Image from "@/components/Image";
import Icon from "@/components/Icon";

type TransfersProps = {
    items: any;
};

const Transfers = ({ items }: TransfersProps) => (
    <div className="lg:card">
        <div className="mb-3 px-5 text-h6 lg:card-title lg:mb-0">
            Latest transfers
        </div>
        <div className="">
            {items.map((item: any) => (
                <div
                    className="flex items-center px-5 py-4 border-b border-n-1 last:border-none md:px-4 dark:border-white"
                    key={item.id}
                >
                    <div className="shrink-0 w-9 h-9">
                        <Image
                            className="w-full"
                            src={item.logo}
                            width={36}
                            height={36}
                            alt="Logo"
                        />
                    </div>
                    <div className="mr-auto px-3.5">
                        <div className="text-sm font-bold">{item.title}</div>
                        <div className="text-xs font-medium text-n-3 dark:text-white/75">
                            {item.details}
                        </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                        <div className="text-sm font-bold">{item.price}</div>
                        <div className="text-xs font-medium text-n-3 dark:text-white/75">
                            {item.date}
                        </div>
                    </div>
                    <button className="btn-transparent-dark btn-square btn-small shrink-0 ml-3.5 md:hidden">
                        <Icon name="dots" />
                    </button>
                </div>
            ))}
        </div>
    </div>
);

export default Transfers;
