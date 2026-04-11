import { useState } from "react";
import { useRouter } from "next/router";
import { Card, Text, Button, TextInput } from "@gravity-ui/uikit";
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
        if (!currentPassword || !newPassword) { setMsg("Заполните все поля"); setMsgOk(false); return; }
        if (newPassword.length < 8) { setMsg("Пароль должен содержать минимум 8 символов"); setMsgOk(false); return; }
        if (newPassword !== confirmPassword) { setMsg("Пароли не совпадают"); setMsgOk(false); return; }
        setSaving(true);
        try {
            await changePassword({ currentPassword, newPassword });
            await logout();
            router.push("/sign-in");
        } catch (e: any) { setMsg(e?.message || "Ошибка"); setMsgOk(false); }
        finally { setSaving(false); }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) { setDeleteMsg("Введите пароль для подтверждения"); return; }
        setDeleting(true); setDeleteMsg(null);
        try { await deleteAccount(deletePassword); router.push("/registration"); }
        catch (e: any) { setDeleteMsg(e?.message || "Ошибка удаления"); }
        finally { setDeleting(false); }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Change password */}
            <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Сменить пароль</Text>
                </div>
                <div style={{ padding: 24, maxWidth: 420 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 6 }}>Текущий пароль</Text>
                            <TextInput type="password" value={currentPassword} onUpdate={setCurrentPassword} placeholder="Введите текущий пароль" size="m" />
                        </div>
                        <div>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 6 }}>Новый пароль</Text>
                            <TextInput type="password" value={newPassword} onUpdate={setNewPassword} placeholder="Введите новый пароль" size="m" />
                        </div>
                        <div>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 6 }}>Подтверждение пароля</Text>
                            <TextInput type="password" value={confirmPassword} onUpdate={setConfirmPassword} placeholder="Повторите новый пароль" size="m" />
                        </div>
                    </div>
                    {msg && (
                        <Text variant="body-1" style={{ display: "block", marginTop: 12, fontWeight: 600, color: msgOk ? "var(--g-color-text-positive)" : "var(--g-color-text-danger)" }}>
                            {msg}
                        </Text>
                    )}
                    <div style={{ marginTop: 24 }}>
                        <Button view="action" size="l" onClick={handleChangePassword} disabled={saving}>
                            {saving ? "Сохраняем..." : "Сменить пароль"}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Danger zone */}
            <Card view="outlined" style={{ background: "var(--g-color-base-float)", borderColor: "var(--g-color-line-danger)", borderWidth: 2 }}>
                <div style={{ padding: "20px 24px", borderBottom: "2px solid var(--g-color-line-danger)" }}>
                    <Text variant="subheader-2" style={{ color: "var(--g-color-text-danger)" }}>Опасная зона</Text>
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>Удалить аккаунт</Text>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>
                                Все данные будут удалены без возможности восстановления
                            </Text>
                        </div>
                        {!deleteConfirm && (
                            <Button view="outlined-danger" size="m" onClick={() => setDeleteConfirm(true)}>
                                Удалить аккаунт
                            </Button>
                        )}
                    </div>
                    {deleteConfirm && (
                        <div style={{ marginTop: 20, maxWidth: 420 }}>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 6 }}>
                                Введите пароль для подтверждения
                            </Text>
                            <TextInput type="password" value={deletePassword} onUpdate={setDeletePassword} placeholder="Ваш пароль" size="m" />
                            {deleteMsg && (
                                <Text variant="body-1" style={{ display: "block", marginTop: 8, fontWeight: 600, color: "var(--g-color-text-danger)" }}>
                                    {deleteMsg}
                                </Text>
                            )}
                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <Button view="outlined" size="m" onClick={() => { setDeleteConfirm(false); setDeletePassword(""); setDeleteMsg(null); }}>
                                    Отмена
                                </Button>
                                <Button view="outlined-danger" size="m" onClick={handleDeleteAccount} disabled={deleting}>
                                    {deleting ? "Удаляем..." : "Подтвердить удаление"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Security;
