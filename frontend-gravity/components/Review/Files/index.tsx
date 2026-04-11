import Icon from "@/components/Icon";

type FilesProps = {
    items: any;
};

const Files = ({ items }: FilesProps) => (
    <div className="mt-2">
        {items.map((item: any) => (
            <div
                className="flex items-center py-4 border-b border-n-1/40 text-sm font-bold last:border-none dark:border-white/40"
                key={item.id}
            >
                <div className="mr-3">
                    <Icon
                        className="icon-22 dark:fill-white"
                        name={item.icon}
                    />
                </div>
                {item.title}
                {item.progress && (
                    <div className="flex items-center shrink-0 ml-auto md:hidden">
                        <div className="relative shrink-0 w-24 h-1.5 mr-3 bg-green-1">
                            <div
                                className="absolute top-0 left-0 bottom-0 bg-n-1/30"
                                style={{ width: item.progress + "%" }}
                            ></div>
                        </div>
                        <Icon name="delete-marker" />
                    </div>
                )}
            </div>
        ))}
    </div>
);

export default Files;
