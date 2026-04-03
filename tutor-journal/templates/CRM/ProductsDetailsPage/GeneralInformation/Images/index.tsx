import Image from "@/components/Image";
import Icon from "@/components/Icon";

type ImagesProps = {
    items: any;
};

const Images = ({ items }: ImagesProps) => (
    <div className="mb-4">
        <div className="mb-4 text-xs font-bold">Images</div>
        <div className="p-2.5 border border-dashed border-n-1 rounded-sm dark:border-white">
            <div className="flex flex-wrap -mt-3 -mx-1.5">
                {items.map((image: any, index: number) => (
                    <div
                        className="relative w-[calc(20%-0.75rem)] mt-3 mx-1.5 border border-n-1 rounded-sm aspect-square md:w-[calc(50%-0.75rem)]"
                        key={index}
                    >
                        <Image
                            className="object-cover ounded-sm"
                            src={image}
                            fill
                            alt=""
                        />
                        <button className="absolute top-2.5 right-2.5 w-8 h-8 bg-purple-1 border border-n-1 rounded-sm text-0 transition-colors hover:bg-purple-2">
                            <Icon name="close" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default Images;
