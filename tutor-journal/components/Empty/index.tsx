import Link from "next/link";
import Image from "@/components/Image";
import Icon from "@/components/Icon";

type EmptyProps = {
    title: string;
    content: string;
    imageSrc?: any;
    imageWidth?: number;
    imageHeight?: number;
    imageSvg?: any;
    buttonUrl?: string;
    buttonIcon?: string;
    buttonText: string;
    onClick?: () => void;
};

const Empty = ({
    title,
    content,
    imageSrc,
    imageWidth,
    imageHeight,
    imageSvg,
    buttonUrl,
    buttonIcon,
    buttonText,
    onClick,
}: EmptyProps) => (
    <div className="flex items-center justify-center grow">
        <div className="w-full max-w-[32rem] text-center">
            {imageSrc && (
                <div className="mb-6">
                    <Image
                        src={imageSrc}
                        width={imageWidth}
                        height={imageHeight}
                        alt=""
                    />
                </div>
            )}
            {imageSvg && (
                <div className="flex justify-center mb-6">{imageSvg}</div>
            )}
            <div className="mb-2 -mx-4 text-h1 md:text-h3">{title}</div>
            <div className="max-w-[23.5rem] mx-auto mb-12">{content}</div>
            {buttonUrl ? (
                <Link className="btn-purple btn-shadow" href={buttonUrl}>
                    <Icon name={buttonIcon || "add-circle"} />
                    <span>{buttonText}</span>
                </Link>
            ) : (
                <button className="btn-purple btn-shadow" onClick={onClick}>
                    <Icon name={buttonIcon || "add-circle"} />
                    <span>{buttonText}</span>
                </button>
            )}
        </div>
    </div>
);

export default Empty;
