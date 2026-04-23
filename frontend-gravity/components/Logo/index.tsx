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
                src="/brand/logo.svg"
                width={1337}
                height={189}
                alt="Repeto"
                priority
            />
        </Link>
    );
};

export default Test;
