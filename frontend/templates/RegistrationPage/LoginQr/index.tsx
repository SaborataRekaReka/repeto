import Icon from "@/components/Icon";
import Image from "@/components/Image";

type LoginQrProps = {};

const LoginQr = ({}: LoginQrProps) => {
    return (
        <>
            <div className="mb-1 text-h1 md:text-h2">Log in with QR</div>
            <div className="mb-12 text-sm text-n-2 dark:text-white/50">
                Scan this code with the mobile app to log in instantly
            </div>
            <div className="relative w-[12.75rem] h-[12.75rem] mx-auto p-2 border border-n-1 rounded-sm dark:border-white">
                <Image
                    className="w-full h-full"
                    src="/images/qr-code.png"
                    width={194}
                    height={194}
                    alt="QR Code"
                />
            </div>
            <div className="flex justify-center items-center py-6">
                <span className="w-full max-w-[8.25rem] h-0.25 bg-n-1 dark:bg-white"></span>
                <span className="mx-4 text-sm font-medium">or</span>
                <span className="w-full max-w-[8.25rem] h-0.25 bg-n-1 dark:bg-white"></span>
            </div>
            <button className="btn-stroke w-full h-14">
                <Icon name="devices" />
                <span>Log in with email or phone number</span>
            </button>
        </>
    );
};

export default LoginQr;
