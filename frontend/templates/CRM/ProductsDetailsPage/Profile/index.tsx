import Image from "@/components/Image";
import Icon from "@/components/Icon";

const list = [
    {
        title: "New sales",
        value: 296,
        counter: -8,
    },
    {
        title: "Followers",
        value: 18,
        counter: 5,
    },
    {
        title: "Regular price",
        value: "$36",
    },
];

type ProfileProps = {};

const Profile = ({}: ProfileProps) => (
    <div className="">
        <div className="mb-8 lg:flex md:mb-6">
            <div className="relative self-center w-[9.375rem] h-[9.375rem] mb-5 border border-n-1 lg:self-start lg:shrink-0 lg:mb-0 md:w-22 md:h-22">
                <Image
                    className="object-cover"
                    src="/images/screenshot-1.jpg"
                    fill
                    alt="Screenshot"
                />
            </div>
            <div className="lg:grow lg:pl-6 md:pl-4">
                <div className="mb-2.5 text-h4 md:text-h6">
                    Neoft UI Kit for NFT Marketplaces
                </div>
                <div className="mb-4 text-xs font-medium md:mb-0">
                    250 Pages and 320 symbols for NFT Marketplace UI design
                </div>
                <div className="label-stroke min-w-[5.125rem] md:hidden">
                    Template
                </div>
            </div>
        </div>
        <div>
            {list.map((item: any, index: number) => (
                <div
                    className="mb-4 pb-4 border-b border-dashed border-n-1 last:mb-0 last:pb-0 last:border-none dark:border-white"
                    key={index}
                >
                    <div className="flex items-center mb-0.5">
                        <div className="font-bold">{item.value}</div>
                        {item.counter && (
                            <div
                                className={`min-w-[1.5rem] ml-1.5 py-0.25 px-1 text-center text-xs font-bold ${
                                    item.counter > 0
                                        ? "bg-green-1"
                                        : "bg-pink-1"
                                }`}
                            >
                                {item.counter}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="text-sm">{item.title}</div>
                        {item.counter && (
                            <Icon
                                className="dark:fill-white"
                                name={
                                    item.counter > 0
                                        ? "arrow-up-right"
                                        : "arrow-down-left"
                                }
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
        <div className="flex mt-8 md:mt-6">
            <button className="btn-stroke btn-medium grow">
                <Icon name="add-circle" />
                <span>Add an update</span>
            </button>
            <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
                <Icon name="folder" />
            </button>
            <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
                <Icon name="arrow-up-right" />
            </button>
        </div>
    </div>
);

export default Profile;
