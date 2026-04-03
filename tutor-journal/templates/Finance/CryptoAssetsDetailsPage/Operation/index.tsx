import Icon from "@/components/Icon";

type OperationProps = {};

const Operation = ({}: OperationProps) => (
    <div className="card">
        <div className="card-title">Start selling or buying</div>
        <div className="pt-13 px-5 pb-6">
            <div className="flex justify-between items-center mb-13">
                <div>
                    <div className="mb-0.5 text-h3">$890.00</div>
                    <div>0.024</div>
                </div>
                <div className="text-center">
                    <div className="text-xs font-bold">USD</div>
                    <button className="btn-stroke btn-small btn-square my-3">
                        <Icon name="transfer" />
                    </button>
                    <div className="text-xs font-bold">BTC</div>
                </div>
            </div>
            <button className="btn-purple btn-small btn-shadow w-full">
                Buy Bitcoin
            </button>
        </div>
    </div>
);

export default Operation;
