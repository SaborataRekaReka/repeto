import Image from "@/components/Image";

type UsersProps = {
    className?: string;
    items: Array<string>;
    large?: boolean;
    border?: boolean;
};

const Users = ({ className, items, large, border }: UsersProps) => (
    <div className={`flex ${className}`}>
        {items.map((image, index) => (
            <div
                className={`relative w-6 h-6 -ml-2 rounded-full first:ml-0 ${
                    border ? "border-2 border-white dark:border-n-1" : ""
                } ${large ? "w-8 h-8 -ml-3 md:-ml-4" : ""}`}
                style={{ zIndex: items.length - index }}
                key={index}
            >
                <Image
                    className="rounded-full object-cover"
                    src={image}
                    fill
                    alt="Avatar"
                />
            </div>
        ))}
    </div>
);

export default Users;
