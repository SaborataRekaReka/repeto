import Image from "@/components/Image";
import Actions from "./Actions";

const list = [
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
    <>
        <div className="relative w-[5.25rem] h-[5.25rem] mb-2.5 lg:mx-auto">
            <Image
                className="object-cover rounded-full"
                src="/images/avatar-3.jpg"
                fill
                alt="Avatar"
            />
        </div>
        <div className="text-h4 lg:text-center">Gabriel Soares</div>
        <div className="mb-6 text-sm lg:text-center">
            UI/UX Designer at Eliassen Group Inc.
        </div>
        <div className="flex items-center text-sm font-medium">
            <div className="w-6 mr-2">
                <Image
                    className="w-full"
                    src="/images/eliassen-group.png"
                    width={24}
                    height={24}
                    alt=""
                />
            </div>
            Eliassen Group Inc.
        </div>
        <div className="mt-6 pt-6 border-t border-dashed border-n-1 dark:border-white">
            <div className="mb-1.5 font-bold">Short bio</div>
            <div className="mb-4 text-sm">
                Once your resume is on Indeed, you can choose to make it public
                or private benefits to options.
            </div>
            <div>
                {list.map((item, index) => (
                    <div className="mb-3 text-sm last:mb-0" key={index}>
                        <div className="mb-0.5">{item.title}</div>
                        <div className="font-bold">{item.content}</div>
                    </div>
                ))}
            </div>
        </div>
        <Actions />
    </>
);

export default Profile;
