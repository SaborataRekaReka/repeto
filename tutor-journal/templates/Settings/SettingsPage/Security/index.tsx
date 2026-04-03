import { useState } from "react";
import Field from "@/components/Field";

const Security = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [telegramLinked, setTelegramLinked] = useState(false);

    return (
        <div className="space-y-6">
            <div className="card">
                <div className="card-title">Сменить пароль</div>
                <div className="p-5">
                    <div className="space-y-4 max-w-md">
                        <Field
                            label="Текущий пароль"
                            type="password"
                            placeholder="Введите текущий пароль"
                            value={currentPassword}
                            onChange={(e: any) =>
                                setCurrentPassword(e.target.value)
                            }
                        />
                        <Field
                            label="Новый пароль"
                            type="password"
                            placeholder="Введите новый пароль"
                            value={newPassword}
                            onChange={(e: any) =>
                                setNewPassword(e.target.value)
                            }
                        />
                        <Field
                            label="Подтверждение пароля"
                            type="password"
                            placeholder="Повторите новый пароль"
                            value={confirmPassword}
                            onChange={(e: any) =>
                                setConfirmPassword(e.target.value)
                            }
                        />
                    </div>
                    <button className="btn-purple min-w-[11.7rem] mt-6 md:w-full">
                        Сменить пароль
                    </button>
                </div>
            </div>
            <div className="card">
                <div className="card-title">Telegram-привязка</div>
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold">
                                {telegramLinked
                                    ? "Telegram привязан"
                                    : "Telegram не привязан"}
                            </div>
                            <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                {telegramLinked
                                    ? "Вы можете входить через Telegram"
                                    : "Привяжите Telegram для входа и уведомлений"}
                            </div>
                        </div>
                        <button
                            className={`${
                                telegramLinked ? "btn-stroke" : "btn-purple"
                            } btn-small min-w-[8rem]`}
                            onClick={() => setTelegramLinked(!telegramLinked)}
                        >
                            {telegramLinked ? "Отвязать" : "Привязать"}
                        </button>
                    </div>
                </div>
            </div>
            <div className="card border-2 border-pink-1">
                <div className="card-title !text-pink-1">Опасная зона</div>
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold">
                                Удалить аккаунт
                            </div>
                            <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                Все данные будут удалены без возможности
                                восстановления
                            </div>
                        </div>
                        <button className="btn-stroke btn-small min-w-[8rem] !border-pink-1 !text-pink-1 hover:!bg-pink-1 hover:!text-n-1">
                            Удалить аккаунт
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Security;
