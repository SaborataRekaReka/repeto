import Link from "next/link";
import Image from "@/components/Image";

type TestProps = {
    className?: string;
};

const Test = ({ className }: TestProps) => {
    return (
        <Link className={`flex w-[9.75rem] ${className}`} href="/">
            <Image
                className="w-full h-auto"
                src="/logo.svg"
                width={1178}
                height={174}
                alt="Repeto"
                priority
            />
        </Link>
    );
};

export default Test;
