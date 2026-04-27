import type { GetServerSideProps, NextPage } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
    const queryIndex = context.resolvedUrl.indexOf("?");
    const querySuffix = queryIndex >= 0 ? context.resolvedUrl.slice(queryIndex) : "";

    return {
        redirect: {
            destination: `/finance/payments${querySuffix}`,
            permanent: false,
        },
    };
};

const PaymentsRedirectPage: NextPage = () => null;

export default PaymentsRedirectPage;
