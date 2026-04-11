import Layout from "@/components/Layout";
import Chart from "./Chart";
import Row from "./Row";

import { transactions1, cardTransactions, deposits } from "@/mocks/finance";

const AccountsV1Page = () => {
    return (
        <Layout title="Accounts">
            <div className="card mb-5">
                <div className="flex items-center h-16 mb-5.5 px-5 border-b border-n-1">
                    <div className="mr-auto text-h6">Your cards</div>
                    <button className="btn-purple btn-small">
                        Open new deposit
                    </button>
                </div>
                <Chart items={transactions1} />
                <table className="w-full">
                    <tbody>
                        {cardTransactions.map((row) => (
                            <Row
                                labelTitle="Card number"
                                labelAmount="Blocked amount"
                                item={row}
                                key={row.id}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="card">
                <div className="flex items-center h-16 px-5 border-b border-n-1 dark:border-white">
                    <div className="mr-auto text-h6">Your deposits</div>
                    <button className="btn-purple btn-small">
                        Open new deposit
                    </button>
                </div>
                <table className="w-full">
                    <tbody>
                        {deposits.map((row) => (
                            <Row
                                labelTitle="Name"
                                labelAmount="Accured"
                                item={row}
                                key={row.id}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default AccountsV1Page;
