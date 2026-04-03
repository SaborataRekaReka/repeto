import { useState } from "react";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";
import Select from "@/components/Select";

const countries = [
    {
        id: "0",
        title: "United States",
    },
    {
        id: "1",
        title: "Ukraine",
    },
    {
        id: "2",
        title: "France",
    },
];

type SignUpProps = {};

const SignUp = ({}: SignUpProps) => {
    const [country, setCountry] = useState<any>(countries[0]);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [agreeEmail, setAgreeEmail] = useState<boolean>(true);
    const [conditions, setConditions] = useState<boolean>(false);

    return (
        <>
            <form action="" onSubmit={() => console.log("Submit")}>
                <div className="mb-1 text-h1">Sign up</div>
                <div className="mb-12 text-sm text-n-2 dark:text-white/50">
                    Before we start, please enter your current location
                </div>
                <Select
                    className="mb-4.5"
                    label="Country/Area of Residence"
                    items={countries}
                    value={country}
                    onChange={setCountry}
                />
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
                <Field
                    className="mb-6.5"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    required
                />
                <Checkbox
                    className="mb-3.5"
                    label="I agree to receive email updates"
                    value={agreeEmail}
                    onChange={() => setAgreeEmail(!agreeEmail)}
                />
                <Checkbox
                    className="mb-6.5"
                    label="I have read and agree to Terms of Service"
                    value={conditions}
                    onChange={() => setConditions(!conditions)}
                />
                <button
                    className="btn-purple btn-shadow w-full h-14"
                    type="submit"
                >
                    Create account
                </button>
            </form>
        </>
    );
};

export default SignUp;
