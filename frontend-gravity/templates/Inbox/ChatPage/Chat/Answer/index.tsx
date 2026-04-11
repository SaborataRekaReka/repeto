import Image from "@/components/Image";

type AnswerProps = {
    time: string;
    content: string;
};

const Answer = ({ time, content }: AnswerProps) => (
    <div className="flex justify-end">
        <div className="flex flex-col items-end grow">
            <div className="flex justify-end mb-1.5 text-xs">
                <div className="">{time}</div>
                <div className="ml-1 font-bold">Gabriela Pires</div>
            </div>
            <div
                className="inline-block px-4 py-1.5 bg-purple-1 text-sm font-medium text-n-1"
                style={{
                    clipPath:
                        "polygon(0 0, calc(100% - 0.7rem) 0, 100% 0.7rem, 100% 100%, 0 100%)",
                }}
            >
                {content}
            </div>
        </div>
        <div className="relative w-8 h-8 ml-2">
            <Image
                className="object-cover rounded-full"
                src="/images/avatars/avatar.jpg"
                fill
                alt="Avatar"
            />
        </div>
    </div>
);

export default Answer;
