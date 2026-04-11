import Image from "@/components/Image";
import Icon from "@/components/Icon";

type AttachmentsProps = {
    images: any;
};

const Attachments = ({ images }: AttachmentsProps) => (
    <div className="mt-5 pt-4 border-t border-dashed border-n-1 dark:border-white">
        <div className="mb-3 font-bold">Attachments</div>
        <div className="flex flex-wrap -mt-3 -ml-3 md:-mt-2 md:-mx-1">
            {images.map((image: any, index: number) => (
                <div
                    className="relative w-24 h-24 mt-3 ml-3 aspect-square border border-n-1 md:w-[calc(50%-0.5rem)] md:mt-2 md:mx-1 dark:border-white"
                    key={index}
                >
                    <Image className="object-cover" src={image} fill alt="" />
                </div>
            ))}
            <div className="relative flex flex-col justify-center items-center w-24 h-24 mt-3 ml-3 border border-n-1 text-xs font-bold md:w-full md:flex-row md:h-8 md:mx-1 dark:border-white">
                <input className="absolute inset-0 opacity-0" type="file" />
                <Icon
                    className="icon-18 mb-2 md:mb-0 md:mr-3 dark:fill-white"
                    name="upload"
                />
                Upload
            </div>
        </div>
    </div>
);

export default Attachments;
