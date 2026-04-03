import Icon from "@/components/Icon";

import { transactionDetails } from "@/mocks/finance";

type DetailsProps = {};

const Details = ({}: DetailsProps) => (
    <div className="card">
        <div className="card-head">
            <div className="text-h6">Transaction Details</div>
            <button className="group">
                <Icon
                    className="icon-18 transition-colors dark:fill-white group-hover:fill-purple-1"
                    name="chart"
                />
            </button>
        </div>
        <div className="pt-2 px-5 pb-5">
            <div>
                {transactionDetails.map((item, index) => (
                    <div
                        className="flex justify-between items-center py-3.5 border-b border-dashed border-n-1 text-sm last:border-none dark:border-white"
                        key={index}
                    >
                        <div className="font-medium text-n-3 dark:text-white/50">
                            {item.title}
                        </div>
                        <div className="font-bold">{item.value}</div>
                    </div>
                ))}
            </div>
            <button className="btn-stroke btn-small w-full mt-4">
                <Icon name="chart-fill" />
                <span>See more details</span>
            </button>
        </div>
    </div>
);

export default Details;
