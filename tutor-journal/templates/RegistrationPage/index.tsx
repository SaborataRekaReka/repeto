import { useState } from "react";
import { useColorMode } from "@chakra-ui/color-mode";
import Head from "next/head";
import Logo from "@/components/Logo";
import Image from "@/components/Image";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import LoginQr from "./LoginQr";

const RegistrationPage = () => {
    const [signUp, setSignUp] = useState<boolean>(false);
    const [forgotPassword, setForgotPassword] = useState<boolean>(false);
    const [loginQr, setLoginQr] = useState<boolean>(false);
    const { colorMode } = useColorMode();
    const isDarkMode = colorMode === "dark";

    const handleClick = () => {
        setSignUp(!signUp);
        setForgotPassword(false);
        setLoginQr(false);
    };

    return (
        <>
            <Head>
                <title>Bruddle</title>
            </Head>
            <div className="relative overflow-hidden">
                <div className="relative z-3 flex flex-col max-w-[75rem] min-h-screen mx-auto px-7.5 py-12 xls:px-20 lg:px-8 md:px-6 md:py-8">
                    <div className="flex flex-col grow max-w-[27.31rem] lg:max-w-[25rem]">
                        <Logo className="w-[6.25rem]" />
                        <div className="my-auto py-12">
                            {forgotPassword ? (
                                <ForgotPassword />
                            ) : loginQr ? (
                                <LoginQr />
                            ) : signUp ? (
                                <SignUp />
                            ) : (
                                <SignIn
                                    onRecover={() => setForgotPassword(true)}
                                    onLoginQr={() => setLoginQr(true)}
                                />
                            )}
                        </div>
                        <div className="text-sm">
                            {signUp || forgotPassword
                                ? "Already registered?"
                                : "You don’t have an account"}
                            <button
                                className="ml-1.5 font-bold transition-colors hover:text-purple-1"
                                onClick={handleClick}
                            >
                                {signUp || forgotPassword
                                    ? "Sign in to your account"
                                    : "Create an account"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="absolute -z-1 inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute z-1 inset-0 bg-n-2 opacity-0 dark:opacity-80"></div>
                    <div className="absolute top-[50%] left-[45vw] -translate-y-1/2 w-[85rem] xl:w-[60rem] lg:left-[50vw] md:-top-[25%] md:-left-[30%] md:translate-y-0 md:w-[30rem]">
                        <Image
                            className=""
                            src="/images/bg.svg"
                            width={1349}
                            height={1216}
                            alt=""
                        />
                    </div>
                </div>
                <div className="absolute top-1/2 right-[calc(50%-61.8125rem)] w-[61.8125rem] -translate-y-1/2 xls:right-[calc(50%-61rem)] xls:w-[55rem] lg:right-[calc(50%-64rem)] md:hidden">
                    <Image
                        className="w-full"
                        src={
                            isDarkMode
                                ? "/images/mockup-dark.png"
                                : "/images/mockup-light.png"
                        }
                        width={989}
                        height={862}
                        alt=""
                    />
                </div>
            </div>
        </>
    );
};

export default RegistrationPage;
