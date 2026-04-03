import Icon from "@/components/Icon";
import Row from "./Row";

import { address, payments } from "@/mocks/crm";

type DeliveryAndPaymentsProps = {};

const DeliveryAndPayments = ({}: DeliveryAndPaymentsProps) => {
    return (
        <div className="card">
            <div className="card-title">Delivery and payments</div>
            <div className="p-5 pt-4">
                <div className="mb-3 text-sm font-bold">Address</div>
                <div className="flex flex-wrap -mt-5 -mx-2.5 mb-6">
                    {address.map((item, index) => (
                        <div
                            className="relative w-[calc(50%-1.25rem)] mt-5 mx-2.5 p-3 border border-dashed border-n-1 md:w-[calc(100%-1.25rem)] dark:border-white"
                            key={index}
                        >
                            <div className="mb-1 text-xs font-medium text-n-3 dark:text-white/50">
                                {item.title}
                            </div>
                            <div className="text-sm font-medium">
                                {item.content}
                            </div>
                            <button className="btn-stroke btn-square btn-small absolute top-3 right-3">
                                <Icon name="print" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mb-3 text-sm font-bold">Payment</div>
                <table className="w-full">
                    <tbody>
                        {payments.map((row) => (
                            <Row item={row} key={row.id} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeliveryAndPayments;
