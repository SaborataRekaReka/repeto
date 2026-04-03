import Image from "@/components/Image";
import Loading from "./Loading";

type QuestionProps = {
    time?: string;
    content?: string;
    images?: Array<string>;
    loading?: boolean;
};

const Question = ({ time, content, images, loading }: QuestionProps) => (
    <div className="flex">
        <div className="relative w-8 h-8 mr-2">
            <Image
                className="object-cover rounded-full"
                src="/images/avatars/avatar-2.jpg"
                fill
                alt="Avatar"
            />
        </div>
        <div className="flex flex-col items-start grow">
            <div className="flex justify-end mb-1.5 text-xs">
                <div className="mr-1 font-bold">Sallie Wade</div>
                <div className="">{time}</div>
            </div>
            <div
                className="inline-block px-4 py-1.5 bg-background text-sm font-medium dark:bg-white/25"
                style={{
                    clipPath:
                        "polygon(0.7rem 0, 100% 0, 100% 100%, 0 100%, 0 0.7rem)",
                }}
            >
                {loading ? <Loading /> : content}
            </div>
            {images && (
                <div className="flex flex-wrap mt-1 -ml-2">
                    {images.map((image: any, index: number) => (
                        <div
                            className="relative w-28 h-[5.25rem] mt-2 ml-2 border border-n-1"
                            key={index}
                        >
                            <Image
                                className="object-cover ounded-sm"
                                src={image}
                                fill
                                alt=""
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

export default Question;
