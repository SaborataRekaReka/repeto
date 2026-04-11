import Image from "@/components/Image";
import Icon from "@/components/Icon";

const details = [
    {
        title: "Certificate",
        content: "Earn a Certificate",
        icon: "certificate",
    },
    {
        title: "Intermediate Level",
        content: "Approx. 12 hours to complete",
        icon: "level",
    },
    {
        title: "English",
        content: "Subtitles: French, German",
        icon: "earth",
    },
];

type DetailsProps = {};

const Details = ({}: DetailsProps) => (
    <>
        <div className="flex justify-center items-center w-21 h-21 mb-2.5 p-4 border border-n-1 rounded-full dark:bg-white dark:border-white">
            <Image
                className="w-full"
                src="/images/google.svg"
                width={48}
                height={48}
                alt=""
            />
        </div>
        <div className="mb-1.5 text-h4">
            Developing Apps with Google Cloud Platform Specialization
        </div>
        <div className="mb-6 text-sm">
            Build secure, scalable, and intelligent cloud-native applications.
        </div>
        <div className="flex items-center text-xs">
            <div className="shrink-0 w-4 -mt-0.5 mr-1.5">
                <Image
                    className="w-full"
                    src="/images/star.svg"
                    width={16}
                    height={16}
                    alt=""
                />
            </div>
            <div className="mr-1.5 font-bold">4.8</div>
            <div className="">(4,121) 100K students</div>
        </div>
        <div className="mt-5 pt-5 border-t border-dashed border-n-1 dark:border-white">
            <div className="mb-1.5 font-bold">Course details</div>
            <div className="mb-4 text-sm">
                This class is intended for developers who want to build
                cloud-native applications.
            </div>
            <div className="">
                {details.map((item, index) => (
                    <div
                        className="flex items-center mb-4 text-sm last:mb-0"
                        key={index}
                    >
                        <div className="flex justify-center items-center w-10 h-10 mr-4 border border-n-1 dark:border-white dark:bg-white">
                            <Icon name={item.icon} />
                        </div>
                        <div className="grow">
                            <div className="font-bold">{item.title}</div>
                            <div>{item.content}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex mt-5 pt-5 border-t border-dashed border-n-1 dark:border-white">
            <button className="btn-purple btn-medium grow dark:border-transparent">
                <Icon name="tasks" />
                <span>Enroll for free</span>
            </button>
            <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
                <Icon name="email" />
            </button>
            <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
                <Icon name="arrow-up-right" />
            </button>
        </div>
    </>
);

export default Details;
