import { useState } from "react";
import Field from "@/components/Field";

type ForgotPasswordProps = {};

const ForgotPassword = ({}: ForgotPasswordProps) => {
    const [email, setEmail] = useState<string>("");

    return (
        <>
            <form action="" onSubmit={() => console.log("Submit")}>
                <div className="mb-1 text-h1">Forgot password?</div>
                <div className="mb-12 text-sm text-n-2 dark:text-white">
                    Enter your email below, you will receive an email with
                    instructions on how to reset your password in a few minutes.
                    You can also set a new password if you’ve never set one
                    before.
                </div>
                <Field
                    className="mb-4.5"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    icon="email"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    required
                />
                <button
                    className="btn-purple btn-shadow w-full h-14"
                    type="submit"
                >
                    Start recovery
                </button>
            </form>
        </>
    );
};

export default ForgotPassword;
