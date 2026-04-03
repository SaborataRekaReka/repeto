import Image from "@/components/Image";

type ItemProps = {
    item: any;
};

const Item = ({ item }: ItemProps) => (
    <div
        className="flex items-center px-4 py-3.5 border-b border-n-1 last:border-none dark:border-white"
        key={item.id}
    >
        <div className="relative shrink-0 w-7 h-7">
            <Image
                className="object-cover rounded-full"
                src={item.avatar}
                fill
                alt="Avatar"
            />
        </div>
        <div className="w-[calc(100%-4.8rem)] mr-auto px-3">
            <div className="truncate text-sm font-bold">{item.name}</div>
            <div className="truncate text-xs">{item.email}</div>
        </div>
        <div className="flex justify-end items-center self-end shrink-0 text-xs font-bold">
            <div
                className={`w-2 h-2 mr-1.5 rounded-full ${
                    item.status === "Away"
                        ? "bg-yellow-1"
                        : item.status === "Offline"
                        ? "bg-pink-1"
                        : "bg-green-1"
                }`}
            ></div>
            {item.status}
        </div>
    </div>
);

export default Item;
