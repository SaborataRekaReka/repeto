import { useState } from "react";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";

type SignUpProps = {};

const SignUp = ({}: SignUpProps) => {
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [passwordConfirm, setPasswordConfirm] = useState<string>("");
    const [conditions, setConditions] = useState<boolean>(false);

    return (
        <>
            <form action="" onSubmit={(e) => { e.preventDefault(); }}>
                <div className="mb-1 text-h1">Регистрация</div>
                <div className="mb-12 text-sm text-n-2 dark:text-white/50">
                    Создайте аккаунт репетитора
                </div>
                <Field
                    className="mb-4.5"
                    label="Ваше имя"
                    type="text"
                    placeholder="Иванов Пётр Сергеевич"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    required
                />
                <Field
                    className="mb-4.5"
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    icon="email"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    required
                />
                <Field
                    className="mb-4.5"
                    label="Телефон"
                    type="tel"
                    placeholder="+7 900 123-45-67"
                    value={phone}
                    onChange={(e: any) => setPhone(e.target.value)}
                />
                <Field
                    className="mb-4.5"
                    label="Пароль"
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    required
                />
                <Field
                    className="mb-6.5"
                    label="Повторите пароль"
                    type="password"
                    placeholder="Повторите пароль"
                    value={passwordConfirm}
                    onChange={(e: any) => setPasswordConfirm(e.target.value)}
                    required
                />
                <Checkbox
                    className="mb-6.5"
                    label="Согласен с условиями использования и политикой конфиденциальности"
                    value={conditions}
                    onChange={() => setConditions(!conditions)}
                />
                <button
                    className="btn-purple btn-shadow w-full h-14"
                    type="submit"
                >
                    Создать аккаунт
                </button>
                <div className="flex justify-center items-center py-6">
                    <span className="w-full max-w-[8.25rem] h-0.25 bg-n-1 dark:bg-white"></span>
                    <span className="mx-4 text-sm font-medium">или</span>
                    <span className="w-full max-w-[8.25rem] h-0.25 bg-n-1 dark:bg-white"></span>
                </div>
                <button
                    className="btn-stroke w-full h-14"
                    type="button"
                >
                    <span>Зарегистрироваться через Telegram</span>
                </button>
            </form>
        </>
    );
};

export default SignUp;