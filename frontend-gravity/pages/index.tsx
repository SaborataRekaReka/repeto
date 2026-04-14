import type { GetServerSideProps, NextPage } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
            destination: "/bazarly/index.html",
            permanent: false,
        },
    };
};

const Home: NextPage = () => null;

export default Home;
