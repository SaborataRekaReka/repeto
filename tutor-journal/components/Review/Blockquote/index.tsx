import Image from "@/components/Image";
import Icon from "@/components/Icon";

type BlockquoteProps = {
    item: any;
};

const Blockquote = ({ item }: BlockquoteProps) => (
    <div className="mt-4 border border-n-1 dark:border-white">
        <div className="relative h-[13.125rem] md:h-30">
            <Image
                className="object-cover"
                src={item.image}
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                alt=""
            />
        </div>
        <div className="p-4 pb-2">
            <div className="mb-5 text-sm font-bold md:mb-3">{item.title}</div>
            <div className="mb-1 text-xs font-medium">{item.content}</div>
            <a
                className="inline-flex items-center font-bold text-xs text-purple-1"
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
            >
                <Icon className="mr-1.5 fill-purple-1" name="external-link" />
                {item.link}
            </a>
        </div>
    </div>
);

export default Blockquote;
