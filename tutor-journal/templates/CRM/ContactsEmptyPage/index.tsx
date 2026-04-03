import { useState } from "react";
import Layout from "@/components/Layout";
import Empty from "@/components/Empty";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import Field from "@/components/Field";

const ContactsEmptyPage = () => {
    const [visible, setVisible] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [position, setPosition] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [email, setEmail] = useState<string>("");

    return (
        <>
            <Layout title="All contacts" background>
                <Empty
                    title="No contacts found?"
                    content="Try to add more contacts from your personal account or invite your friends"
                    imageSvg={
                        <svg
                            className="fill-n-1 dark:fill-white"
                            xmlns="http://www.w3.org/2000/svg"
                            width="63"
                            height="84"
                            viewBox="0 0 63 84"
                        >
                            <path d="M28.718.02C21.91.709 15.764 4.488 12.427 10.589c-3.45 6.307-3.188 14.053.571 20.182 7.905 12.887 27.093 13.619 36.543 2.073 3.04-3.714 5.143-8.267 4.253-13.169-.729-4.018-4.057-7.984-8.235-8.563-2.648-.367-5.644.641-6.315 3.598-.55 2.424.74 5.944 3.586 6.338.226.031.445.081.669.117.673.108-.238-.058-.184-.118-.274.307 1.331.054.052-.008l.159.164c.199.217.212.22.039.009-.21.092.068-.255.119.242-.008-.075-.242-.742-.054-.166.072.22.139.442.187.67-.122-.59-.026-.136-.047.208 0-.004-.119.864-.031.428.104-.517-.197.592-.225.686-.16.527-.05.228.004.095-.106.262-.253.517-.387.765a17.59 17.59 0 0 1-.882 1.43c-.323.481-.038.079.034-.014a13.84 13.84 0 0 1-.844.967 18.14 18.14 0 0 1-1.098 1.079 17.88 17.88 0 0 1-.581.505c.086-.072.498-.365.022-.023-.971.699-2.011 1.312-3.101 1.805-.544.246-.057.015.044-.023l-.725.255a18.05 18.05 0 0 1-1.478.421c-.243.058-1.741.293-.907.207a17.2 17.2 0 0 1-1.842.089 17.73 17.73 0 0 1-1.597-.079c-.882-.084.65.137-.219-.04l-.783-.163c-.519-.122-1.033-.267-1.539-.435a14.32 14.32 0 0 1-.752-.271c-.808-.32.535.278-.237-.12a20.12 20.12 0 0 1-1.622-.913c-.159-.102-1.149-.852-.675-.456a15.1 15.1 0 0 1-1.169-1.093c-.186-.192-.361-.393-.539-.592-.222-.269-.233-.269-.033.001l-.309-.436a19.12 19.12 0 0 1-.838-1.366c-.091-.167-.632-1.319-.383-.706a13.92 13.92 0 0 1-.569-1.779c-.065-.253-.307-1.734-.234-.991a14.22 14.22 0 0 1-.065-1.599c.005-.323.126-1.495-.016-.58.085-.544.209-1.083.36-1.613.079-.278.573-1.58.211-.763.256-.575.555-1.135.882-1.673a15.64 15.64 0 0 1 .384-.598c.052-.077.615-.827.299-.434-.334.416.173-.183.201-.212l.649-.692c.195-.196 1.47-1.295.75-.746a14.16 14.16 0 0 1 2.841-1.679c-.821.364.663-.185.988-.271.315-.083 1.955-.32.959-.219 2.664-.269 5.267-2.177 5.134-5.152-.114-2.56-2.272-5.441-5.134-5.152h0zm-18.37 75.785c-.1-5.584-.543-12.502 3.38-17.023s11.477-3.38 16.77-3.329l11.096.109c.769.008 1.557-.041 2.324.03 2.475.228-.262.095.323-.454a225.67 225.67 0 0 1 1.453 3.879l7.059 21.382c2.091 6.334 12.066 3.619 9.957-2.772l-4.392-13.304c-1.433-4.341-2.567-8.966-4.481-13.12-2.065-4.483-6.107-5.935-10.729-6.052-4.536-.116-9.081-.089-13.618-.134-8.103-.08-17.128-.159-23.063 6.392C.357 58.11-.131 67.187.022 75.805c.12 6.701 10.446 6.723 10.326 0z" />
                        </svg>
                    }
                    buttonText="Create new contact"
                    onClick={() => setVisible(true)}
                />
            </Layout>
            <Modal
                title="Create new contact"
                visible={visible}
                onClose={() => setVisible(false)}
            >
                <form action="" onSubmit={() => console.log("Submit")}>
                    <div className="relative flex justify-center items-center w-[6.375rem] h-[6.375rem] mx-auto mb-6 bg-purple-3">
                        <input
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            type="file"
                        />
                        <Icon className="icon-18" name="download" />
                    </div>
                    <Field
                        className="mb-4"
                        label="Full Name"
                        placeholder="Enter full name"
                        value={name}
                        onChange={(e: any) => setName(e.target.value)}
                        required
                    />
                    <Field
                        className="mb-4"
                        label="Position"
                        placeholder="Enter position"
                        value={position}
                        onChange={(e: any) => setPosition(e.target.value)}
                        required
                    />
                    <Field
                        className="mb-4"
                        label="Phone number"
                        placeholder="Enter phone number"
                        type="tel"
                        value={phone}
                        onChange={(e: any) => setPhone(e.target.value)}
                        required
                    />
                    <Field
                        className="mb-6"
                        label="Email"
                        placeholder="Enter email"
                        type="email"
                        value={email}
                        onChange={(e: any) => setEmail(e.target.value)}
                        required
                    />
                    <button className="btn-purple btn-shadow w-full">
                        Add contact
                    </button>
                </form>
            </Modal>
        </>
    );
};

export default ContactsEmptyPage;
