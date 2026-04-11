import Image from "@/components/Image";
import Icon from "@/components/Icon";

const list = [
    {
        title: "Email",
        content: "gab*****@gmail.com",
    },
    {
        title: "Payment option",
        content: "PayPal",
    },
    {
        title: "Address",
        content: "Ridge Suite 862, St. Rudy, WA 2317",
    },
    {
        title: "Phone",
        content: "+64 456 869 393",
    },
    {
        title: "Public link",
        content: "http://whiteui.store/l.saunders",
    },
];

type ProfileProps = {};

const Profile = ({}: ProfileProps) => (
    <div className="lg:card">
        <div className="lg:hidden">
            <div className="relative w-[5.25rem] h-[5.25rem] mb-2.5">
                <Image
                    className="object-cover rounded-full"
                    src="/images/avatar-3.jpg"
                    fill
                    alt="Avatar"
                />
            </div>
            <div className="text-h4">Gabriel Soares</div>
            <div className="text-sm">London, UK</div>
        </div>
        <div className="card-title hidden lg:flex">Contact details</div>
        <div className="lg:px-5 lg:py-6">
            <div className="mt-5 pt-5 border-t border-dashed border-n-1 lg:mt-0 lg:pt-0 lg:border-none dark:border-white">
                <div>
                    {list.map((item, index) => (
                        <div className="mb-5 text-sm last:mb-0" key={index}>
                            <div className="mb-0.5">{item.title}</div>
                            <div className="font-bold">{item.content}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex mt-5 pt-5 border-t border-dashed border-n-1 lg:mt-6 lg:pt-0 lg:border-none dark:border-white">
                <button className="btn-purple btn-medium grow dark:border-transparent">
                    <Icon name="add-circle" />
                    <span>Add new invoice</span>
                </button>
                <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
                    <Icon name="email" />
                </button>
                <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
                    <Icon name="arrow-up-right" />
                </button>
            </div>
        </div>
    </div>
);

export default Profile;
