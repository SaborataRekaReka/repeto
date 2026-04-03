import { useState } from "react";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";

type SignInProps = {
    onRecover: () => void;
};

const SignIn = ({ onRecover }: SignInProps) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [remember, setRemember] = useState<boolean>(false);

    return (
        <>
            <form action="" onSubmit={(e) => { e.preventDefault(); }}>
                <div className="mb-1 text-h1">Вход</div>
                <div className="mb-12 text-sm text-n-2 dark:text-white/50">
                    Введите данные вашего аккаунта
                </div>
                <Field
                    className="mb-4.5"
                    label="Email или телефон"
                    type="text"
                    placeholder="Введите email или телефон"
                    icon="email"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    required
                />
                <Field
                    className="mb-6.5"
                    label="Пароль"
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    required
                />
                <div className="flex justify-between items-center mb-6.5">
                    <Checkbox
                        label="Запомнить меня"
                        value={remember}
                        onChange={() => setRemember(!remember)}
                    />
                    <button
                        className="mt-0.5 text-xs font-bold transition-colors hover:text-purple-1"
                        type="button"
                        onClick={onRecover}
                    >
                        Забыли пароль?
                    </button>
                </div>
                <button
                    className="btn-purple btn-shadow w-full h-14"
                    type="submit"
                >
                    Войти
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
                    <span>Войти через Telegram</span>
                </button>
            </form>
        </>
    );
};

export default SignIn;