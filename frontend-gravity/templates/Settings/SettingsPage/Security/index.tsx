import { useState } from "react";
import { useRouter } from "next/router";
import { Alert, Card, Text, Button, TextInput } from "@gravity-ui/uikit";
import { changePassword, deleteAccount } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { codedErrorMessage } from "@/lib/errorCodes";
import AppField from "@/components/AppField";

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
        } catch (e: any) { setMsg(codedErrorMessage("SETT-SEC-PWD", e)); setMsgOk(false); }
        finally { setSaving(false); }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) { setDeleteMsg("Введите пароль для подтверждения"); return; }
        setDeleting(true); setDeleteMsg(null);
        try { await deleteAccount(deletePassword); router.push("/auth?view=signin"); }
        catch (e: any) { setDeleteMsg(codedErrorMessage("SETT-SEC-DEL", e)); }
        finally { setDeleting(false); }
    };

    return (
        <div className="repeto-settings-stack">
            {/* Change password */}
            <Card className="repeto-settings-section-card" view="outlined">
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Сменить пароль</Text>
                </div>
                <div style={{ padding: 24, maxWidth: 420 }}>
                    <div className="repeto-settings-stack">
                        <AppField label="Текущий пароль">
                            <TextInput type="password" value={currentPassword} onUpdate={setCurrentPassword} placeholder="Введите текущий пароль" size="l" />
                        </AppField>
                        <AppField label="Новый пароль">
                            <TextInput type="password" value={newPassword} onUpdate={setNewPassword} placeholder="Введите новый пароль" size="l" />
                        </AppField>
                        <AppField label="Подтверждение пароля">
                            <TextInput type="password" value={confirmPassword} onUpdate={setConfirmPassword} placeholder="Повторите новый пароль" size="l" />
                        </AppField>
                    </div>
                    {msg && (
                        <Text variant="body-1" className={`repeto-settings-status-message ${msgOk ? "repeto-settings-status-message--ok" : "repeto-settings-status-message--error"}`}>
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
            <Card className="repeto-settings-section-card repeto-settings-section-card--danger" view="outlined">
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
                            <Button view="outlined-danger" size="l" onClick={() => setDeleteConfirm(true)}>
                                Удалить аккаунт
                            </Button>
                        )}
                    </div>
                    {deleteConfirm && (
                        <div style={{ marginTop: 20, maxWidth: 420 }}>
                            <Alert
                                theme="danger"
                                view="filled"
                                corners="rounded"
                                title="Подтвердите удаление аккаунта"
                                message={
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        <div>После удаления восстановить данные будет невозможно.</div>
                                        <Text variant="caption-2" color="secondary" style={{ display: "block" }}>
                                            Введите пароль для подтверждения
                                        </Text>
                                        <TextInput
                                            type="password"
                                            value={deletePassword}
                                            onUpdate={setDeletePassword}
                                            placeholder="Ваш пароль"
                                            size="l"
                                        />
                                        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                                            <Button view="outlined" size="l" onClick={() => { setDeleteConfirm(false); setDeletePassword(""); setDeleteMsg(null); }}>
                                                Отмена
                                            </Button>
                                            <Button view="outlined-danger" size="l" onClick={handleDeleteAccount} disabled={deleting}>
                                                {deleting ? "Удаляем..." : "Подтвердить удаление"}
                                            </Button>
                                        </div>
                                    </div>
                                }
                            />
                            {deleteMsg && (
                                <Alert
                                    theme="danger"
                                    view="filled"
                                    corners="rounded"
                                    title="Не удалось удалить аккаунт"
                                    message={deleteMsg}
                                    style={{ marginTop: 8 }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Security;
