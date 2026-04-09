import { useState } from "react";
import { useRouter } from "next/router";
import Field from "@/components/Field";
import Icon from "@/components/Icon";
import { changePassword, deleteAccount } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";

const Security = () => {
    const router = useRouter();
    const { logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [msgOk, setMsgOk] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

    const handleChangePassword = async () => {
        setMsg(null);
        if (!currentPassword || !newPassword) {
            setMsg("Заполните все поля");
            setMsgOk(false);
            return;
        }
        if (newPassword.length < 8) {
            setMsg("Пароль должен содержать минимум 8 символов");
            setMsgOk(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            setMsg("Пароли не совпадают");
            setMsgOk(false);
            return;
        }
        setSaving(true);
        try {
            await changePassword({ currentPassword, newPassword });
            // Force re-login so user confirms new password works
            await logout();
            router.push("/sign-in");
        } catch (e: any) {
            setMsg(e?.message || "Ошибка");
            setMsgOk(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteMsg("Введите пароль для подтверждения");
            return;
        }
        setDeleting(true);
        setDeleteMsg(null);
        try {
            await deleteAccount(deletePassword);
            router.push("/registration");
        } catch (e: any) {
            setDeleteMsg(e?.message || "Ошибка удаления");
        } finally {
            setDeleting(false);
        }
    };

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
                    {msg && (
                        <div className={`mt-3 text-xs font-bold ${msgOk ? "text-green-1" : "text-pink-1"}`}>
                            {msg}
                        </div>
                    )}
                    <button
                        className="btn-purple min-w-[11.7rem] mt-6 md:w-full"
                        onClick={handleChangePassword}
                        disabled={saving}
                    >
                        {saving ? "Сохраняем..." : "Сменить пароль"}
                    </button>
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
                        {!deleteConfirm && (
                            <button
                                className="btn-stroke btn-small min-w-[8rem] !border-pink-1 !text-pink-1 !fill-pink-1 hover:!bg-pink-1 hover:!text-n-1 hover:!fill-n-1"
                                onClick={() => setDeleteConfirm(true)}
                            >
                                <Icon name="remove" />
                                Удалить аккаунт
                            </button>
                        )}
                    </div>
                    {deleteConfirm && (
                        <div className="mt-4 max-w-md space-y-3">
                            <Field
                                label="Введите пароль для подтверждения"
                                type="password"
                                placeholder="Ваш пароль"
                                value={deletePassword}
                                onChange={(e: any) =>
                                    setDeletePassword(e.target.value)
                                }
                            />
                            {deleteMsg && (
                                <div className="text-xs font-bold text-pink-1">
                                    {deleteMsg}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    className="btn-stroke btn-small"
                                    onClick={() => {
                                        setDeleteConfirm(false);
                                        setDeletePassword("");
                                        setDeleteMsg(null);
                                    }}
                                >
                                    Отмена
                                </button>
                                <button
                                    className="btn-small !bg-pink-1 !text-white !border-pink-1"
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                >
                                    {deleting
                                        ? "Удаляем..."
                                        : "Подтвердить удаление"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Security;
