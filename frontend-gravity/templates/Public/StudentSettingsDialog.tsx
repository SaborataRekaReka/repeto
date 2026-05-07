import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button, Icon, Text, TextInput } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { CircleInfo, Moon, Sun } from "@gravity-ui/icons";
import AppDialog from "@/components/AppDialog";
import AppField from "@/components/AppField";
import PhoneInput from "@/components/PhoneInput";
import StudentAvatar from "@/components/StudentAvatar";
import { useThemeMode } from "@/contexts/ThemeContext";
import { resolveApiAssetUrl } from "@/lib/api";
import { studentApi } from "@/lib/studentAuth";
import SectionCard from "@/templates/Settings/SettingsPage/Account/SectionCard";

type StudentProfileDraft = {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    age?: number | string | null;
    grade?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    parentEmail?: string | null;
};

type StudentSettingsDialogProps = {
    open: boolean;
    onClose: () => void;
    fallbackProfile?: StudentProfileDraft;
    onLogout?: () => void | Promise<void>;
    onSaved?: (profile: { name: string; avatarUrl: string | null }) => void | Promise<void>;
    reloadOnSave?: boolean;
};

function normalizeAvatarUrl(value?: string | null): string | null {
    if (!value) return null;
    if (value.startsWith("data:")) return value;
    return resolveApiAssetUrl(value) || null;
}

const StudentSettingsDialog = ({
    open,
    onClose,
    fallbackProfile,
    onLogout,
    onSaved,
    reloadOnSave = false,
}: StudentSettingsDialogProps) => {
    const { theme, setTheme } = useThemeMode();
    const [settingsName, setSettingsName] = useState("");
    const [settingsEmail, setSettingsEmail] = useState("");
    const [settingsPhone, setSettingsPhone] = useState("");
    const [settingsGrade, setSettingsGrade] = useState("");
    const [settingsAge, setSettingsAge] = useState("");
    const [settingsParentName, setSettingsParentName] = useState("");
    const [settingsParentPhone, setSettingsParentPhone] = useState("");
    const [settingsParentEmail, setSettingsParentEmail] = useState("");
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [settingsAvatarSrc, setSettingsAvatarSrc] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const avatarUploadRef = useRef<Promise<unknown> | null>(null);

    const applyProfileDraft = useCallback((profile?: StudentProfileDraft) => {
        setSettingsName(String(profile?.name || ""));
        setSettingsEmail(String(profile?.email || ""));
        setSettingsPhone(String(profile?.phone || ""));
        setSettingsGrade(String(profile?.grade || ""));
        setSettingsAge(profile?.age ? String(profile.age) : "");
        setSettingsParentName(String(profile?.parentName || ""));
        setSettingsParentPhone(String(profile?.parentPhone || ""));
        setSettingsParentEmail(String(profile?.parentEmail || ""));
        setSettingsAvatarSrc(normalizeAvatarUrl(profile?.avatarUrl));
    }, []);

    useEffect(() => {
        if (!open) return;

        let canceled = false;
        setSettingsError("");
        setSettingsLoading(true);
        applyProfileDraft(fallbackProfile);

        studentApi<StudentProfileDraft>("/student-portal/setup")
            .then((profile) => {
                if (canceled) return;
                applyProfileDraft(profile);
            })
            .catch(() => {
                if (!canceled) {
                    setSettingsError("Не удалось загрузить актуальные данные профиля.");
                }
            })
            .finally(() => {
                if (!canceled) setSettingsLoading(false);
            });

        return () => {
            canceled = true;
        };
    }, [
        open,
        fallbackProfile?.name,
        fallbackProfile?.email,
        fallbackProfile?.phone,
        fallbackProfile?.avatarUrl,
        fallbackProfile?.age,
        fallbackProfile?.grade,
        fallbackProfile?.parentName,
        fallbackProfile?.parentPhone,
        fallbackProfile?.parentEmail,
        applyProfileDraft,
    ]);

    const handleAvatarChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";

        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            setSettingsError("Загрузите JPG или PNG до 5 МБ.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => setSettingsAvatarSrc(ev.target?.result as string);
        reader.readAsDataURL(file);

        const uploadPromise = (async () => {
            try {
                const formData = new FormData();
                formData.append("file", file);
                const result = await studentApi<{ avatarUrl: string }>("/student-portal/avatar", {
                    method: "POST",
                    body: formData,
                });
                setSettingsAvatarSrc(normalizeAvatarUrl(result.avatarUrl));
                setSettingsError("");
            } catch {
                setSettingsError("Фото не загрузилось. Попробуйте выбрать другой файл.");
            }
        })();

        avatarUploadRef.current = uploadPromise;
        await uploadPromise;
        avatarUploadRef.current = null;
    }, []);

    const handleSettingsSave = useCallback(async () => {
        setSettingsSaving(true);
        setSettingsError("");

        if (avatarUploadRef.current) {
            await avatarUploadRef.current;
        }

        const normalizedAge = Number(String(settingsAge || "").trim());
        const safeAge = Number.isFinite(normalizedAge) && normalizedAge > 0
            ? Math.floor(normalizedAge)
            : null;

        try {
            await studentApi("/student-portal/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    name: settingsName.trim(),
                    phone: settingsPhone.trim() || null,
                    grade: settingsGrade.trim() || null,
                    age: safeAge,
                    parentName: settingsParentName.trim() || null,
                    parentPhone: settingsParentPhone.trim() || null,
                    parentEmail: settingsParentEmail.trim() || null,
                }),
            });

            await onSaved?.({
                name: settingsName.trim() || "Ученик",
                avatarUrl: settingsAvatarSrc,
            });
            onClose();

            if (reloadOnSave && typeof window !== "undefined") {
                window.location.reload();
            }
        } catch {
            setSettingsError("Не удалось сохранить. Попробуйте ещё раз.");
        } finally {
            setSettingsSaving(false);
        }
    }, [
        settingsAge,
        settingsName,
        settingsPhone,
        settingsGrade,
        settingsParentName,
        settingsParentPhone,
        settingsParentEmail,
        settingsAvatarSrc,
        onSaved,
        onClose,
        reloadOnSave,
    ]);

    const handleLogout = useCallback(() => {
        void Promise.resolve(onLogout?.()).finally(onClose);
    }, [onLogout, onClose]);

    return (
        <AppDialog
            open={open}
            onClose={onClose}
            size="m"
            caption="Настройки профиля"
            className="repeto-portal-settings-dialog"
            bodyClassName="repeto-settings-content repeto-portal-settings-content"
            footer={{
                textButtonApply: "Сохранить",
                onClickButtonApply: handleSettingsSave,
                propsButtonApply: {
                    loading: settingsSaving,
                    disabled: !settingsName.trim(),
                },
                textButtonCancel: "Отмена",
                onClickButtonCancel: onClose,
                entityActions: onLogout ? (
                    <Button view="flat-danger" size="l" onClick={handleLogout}>
                        Выйти из аккаунта
                    </Button>
                ) : undefined,
            }}
        >
            <div className="repeto-settings-account-stack repeto-portal-settings-stack">
                {settingsLoading ? (
                    <Text variant="body-1" color="secondary" className="repeto-portal-settings-status">
                        Загружаем актуальные данные профиля...
                    </Text>
                ) : null}

                <SectionCard
                    title="Профиль"
                    className="repeto-settings-portrait-section"
                    titleSlot={<div className="repeto-settings-portrait-title">Профиль</div>}
                >
                    <div className="repeto-settings-portrait-row repeto-portal-settings-portrait-row">
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="repeto-settings-avatar-trigger repeto-settings-avatar-trigger--account repeto-portal-settings-avatar-trigger"
                            aria-label="Изменить фото ученика"
                        >
                            <StudentAvatar
                                student={{
                                    name: settingsName || "Ученик",
                                    avatarUrl: settingsAvatarSrc || undefined,
                                }}
                                size="l"
                                style={{ width: "100%", height: "100%", minWidth: "100%" }}
                            />
                        </button>
                        <div className="repeto-settings-portrait-meta">
                            <Button
                                view="flat"
                                size="l"
                                className="repeto-settings-portrait-button"
                                onClick={() => avatarInputRef.current?.click()}
                            >
                                Изменить фото
                            </Button>
                            <span className="repeto-settings-portrait-caption">
                                JPG или PNG до 5 МБ. Фото отображается в кабинете и на занятиях.
                            </span>
                        </div>
                        <span
                            className="repeto-settings-portrait-help"
                            aria-label="Фото ученика"
                            title="Фото помогает репетитору быстрее узнавать ученика в списках и занятиях"
                        >
                            <Icon data={CircleInfo as IconData} size={22} />
                        </span>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="repeto-hidden-file-input"
                            onChange={handleAvatarChange}
                        />
                    </div>
                </SectionCard>

                <SectionCard title="Личные данные" bodyClassName="repeto-settings-account-grid">
                    <AppField label="ФИО" required>
                        <TextInput
                            value={settingsName}
                            onUpdate={setSettingsName}
                            placeholder="Иванов Пётр Сергеевич"
                            size="l"
                        />
                    </AppField>

                    <AppField label="Email">
                        <TextInput value={settingsEmail} size="l" disabled />
                    </AppField>

                    <AppField label="Телефон">
                        <PhoneInput value={settingsPhone} onUpdate={setSettingsPhone} />
                    </AppField>

                    <AppField label="Класс">
                        <TextInput
                            value={settingsGrade}
                            onUpdate={setSettingsGrade}
                            placeholder="11"
                            size="l"
                        />
                    </AppField>

                    <AppField label="Возраст">
                        <TextInput
                            value={settingsAge}
                            onUpdate={setSettingsAge}
                            placeholder="15"
                            size="l"
                            type="number"
                        />
                    </AppField>
                </SectionCard>

                <SectionCard title="Контакт родителя" bodyClassName="repeto-settings-account-grid">
                    <AppField label="ФИО родителя">
                        <TextInput
                            value={settingsParentName}
                            onUpdate={setSettingsParentName}
                            placeholder="Иванова Мария Петровна"
                            size="l"
                        />
                    </AppField>

                    <AppField label="Телефон родителя">
                        <PhoneInput value={settingsParentPhone} onUpdate={setSettingsParentPhone} />
                    </AppField>

                    <AppField label="Email родителя">
                        <TextInput
                            value={settingsParentEmail}
                            onUpdate={setSettingsParentEmail}
                            placeholder="parent@email.com"
                            size="l"
                            type="email"
                        />
                    </AppField>
                </SectionCard>

                <SectionCard title="Тема оформления">
                    <div className="repeto-settings-pill-row repeto-portal-settings-theme-row">
                        <button
                            type="button"
                            className={`repeto-settings-pill repeto-portal-settings-theme-pill${
                                theme === "light" ? " repeto-settings-pill--active" : ""
                            }`}
                            onClick={() => setTheme("light")}
                        >
                            <Icon data={Sun as IconData} size={16} />
                            <span>Светлая</span>
                        </button>
                        <button
                            type="button"
                            className={`repeto-settings-pill repeto-portal-settings-theme-pill${
                                theme === "dark" ? " repeto-settings-pill--active" : ""
                            }`}
                            onClick={() => setTheme("dark")}
                        >
                            <Icon data={Moon as IconData} size={16} />
                            <span>Тёмная</span>
                        </button>
                    </div>
                </SectionCard>

                {settingsError && (
                    <div className="repeto-settings-savebar repeto-portal-settings-error">
                        <Text as="div" variant="body-1" className="repeto-settings-savebar__message repeto-settings-savebar__message--error">
                            {settingsError}
                        </Text>
                    </div>
                )}
            </div>
        </AppDialog>
    );
};

export default StudentSettingsDialog;
