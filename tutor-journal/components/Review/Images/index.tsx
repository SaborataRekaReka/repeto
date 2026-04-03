import Image from "@/components/Image";

type ImagesProps = {
    items: any;
    imageBig?: boolean;
};

const Images = ({ items, imageBig }: ImagesProps) => (
    <div className="flex mt-4 space-x-3">
        {items.map((image: any, index: number) => (
            <div
                className={`relative flex-1 border border-n-1 dark:border-white ${
                    imageBig
                        ? "h-[16.25rem] md:h-[7rem]"
                        : "h-[9.375rem] md:h-[7rem]"
                }`}
                key={index}
            >
                <Image
                    className="object-cover"
                    src={image}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
                    alt=""
                />
            </div>
        ))}
    </div>
);

export default Images;
