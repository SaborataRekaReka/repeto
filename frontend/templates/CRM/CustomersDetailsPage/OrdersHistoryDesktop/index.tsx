import Icon from "@/components/Icon";
import Image from "@/components/Image";

type OrdersHistoryDesktopProps = {
    items: any;
};

const OrdersHistoryDesktop = ({ items }: OrdersHistoryDesktopProps) => {
    return (
        <div className="mb-4 card">
            <div className="card-title">Orders history</div>
            <div className="">
                <table className="table-custom -mt-0.25 border-none">
                    <tbody>
                        {items.map((item: any) => (
                            <tr className="" key={item.id}>
                                <td className="td-custom">
                                    <div className="inline-flex items-center text-sm font-bold">
                                        <div className="w-15 mr-3 border border-n-1">
                                            <Image
                                                className="w-full"
                                                src={item.image}
                                                width={60}
                                                height={42}
                                                alt=""
                                            />
                                        </div>
                                        {item.title}
                                    </div>
                                </td>
                                <td className="td-custom text-right font-medium">
                                    {item.date}
                                </td>
                                <td className="td-custom text-right font-bold">
                                    ${item.price}
                                </td>
                                <td className="td-custom text-right">
                                    <div
                                        className={`min-w-[5.25rem] ${
                                            item.status === "Pending"
                                                ? "label-yellow"
                                                : "label-green"
                                        }`}
                                    >
                                        {item.status}
                                    </div>
                                </td>
                                <td className="td-custom w-13 !px-3 text-right">
                                    <button className="btn-transparent-dark btn-small btn-square">
                                        <Icon name="dots" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersHistoryDesktop;
