import Image from "@/components/Image";
import Icon from "@/components/Icon";

type RowProps = {
    item: any;
};

const Row = ({ item }: RowProps) => (
    <tr className="text-sm">
        <td className="px-3 py-2.5 pl-0 align-middle">
            <div className="flex items-center font-bold">
                <div className="w-8 h-8 mr-3 p-2 bg-background rounded-full">
                    <Image
                        className="w-full"
                        src={item.logo}
                        width={16}
                        height={16}
                        alt=""
                    />
                </div>
                {item.title}
            </div>
        </td>
        <td className="px-3 py-2.5 align-middle md:text-right md:pr-0">
            <div className="label-stroke">{item.status}</div>
        </td>
        <td className="px-3 py-2.5 align-middle text-right font-medium md:hidden">
            {item.date}
        </td>
        <td className="pl-3 pr-5 py-2.5 align-middle text-right font-medium md:hidden">
            {item.email}
        </td>
        <td className="w-8 px-0 py-2.5 align-middle md:hidden">
            <button className="btn-transparent-dark btn-small btn-square">
                <Icon name="dots" />
            </button>
        </td>
    </tr>
);

export default Row;
