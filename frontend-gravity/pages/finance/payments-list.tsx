import type { GetServerSideProps, NextPage } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
            destination: "/finance/payments",
            permanent: false,
        },
    };
};

const FinancePaymentsListRedirectPage: NextPage = () => null;

export default FinancePaymentsListRedirectPage;
