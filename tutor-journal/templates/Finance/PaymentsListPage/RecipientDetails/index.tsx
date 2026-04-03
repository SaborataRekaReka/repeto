import Modal from "@/components/Modal";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

const details = [
    {
        title: "Account holder name",
        value: "Rustem Tolstobrov",
        icon: "profile",
    },
    {
        title: "Routing number",
        value: "017062169",
        icon: "file-1",
    },
    {
        title: "Account number",
        value: "8910242076",
        icon: "bag-stroke",
    },
    {
        title: "Currency",
        value: "usd",
        icon: "card",
    },
    {
        title: "Account type",
        value: "Checking",
        icon: "folder-fill",
    },
];

type DetailsProps = {
    visible: boolean;
    onClose: () => void;
};

const Details = ({ visible, onClose }: DetailsProps) => {
    return (
        <Modal
            classWrap="relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[10.4375rem] before:bg-[#6653CE] md:before:h-[8rem]"
            classButtonClose="z-2 fill-white"
            visible={visible}
            onClose={onClose}
        >
            <div className="relative z-1 card-title border-white text-white">
                Recipient details
            </div>
            <div className="pt-18 px-5 pb-7 md:pt-8">
                <div className="mb-6 text-center">
                    <div className="relative z-1 w-15 h-15 mx-auto mb-3 border-4 border-white rounded-full dark:border-n-1">
                        <Image
                            className="w-full rounded-full"
                            src="/images/avatars/avatar-3.jpg"
                            width={60}
                            height={60}
                            alt="Logo"
                            priority
                        />
                    </div>
                    <div className="mb-1 text-h4">Rustem Tolstobrov</div>
                    <div className="text-sm font-medium text-n-3 dark:text-white/50">
                        Account ending in 3456
                    </div>
                </div>
                <div className="mb-4">
                    {details.map((item, index) => (
                        <div
                            className="flex items-center py-4 border-b border-dashed border-n-1 last:border-none dark:border-white"
                            key={index}
                        >
                            <Icon
                                className="mr-3 dark:fill-white"
                                name={item.icon}
                            />
                            <div className="mr-auto pr-3 text-xs font-medium text-n-3 dark:text-white/50">
                                {item.title}
                            </div>
                            {item.title === "Currency" && (
                                <div className="w-3.5 mr-1.5 text-0">
                                    <Image
                                        className="w-fill"
                                        width={14}
                                        height={14}
                                        src={`/images/${item.value}.svg`}
                                        alt="Currency"
                                    />
                                </div>
                            )}
                            <div
                                className={`text-sm font-bold ${
                                    item.title === "Currency" && "uppercase"
                                }`}
                            >
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between md:block">
                    <button className="btn-stroke min-w-[10.125rem] outline-none md:w-full md:mb-3">
                        Send Funds
                    </button>
                    <button className="btn-stroke min-w-[10.125rem] outline-none md:w-full">
                        Edit Details
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default Details;
