import { useEffect, useState } from "react";
import { Card, Text, Button, Icon, TextInput, TextArea, Select } from "@gravity-ui/uikit";
import { Plus, Xmark } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, updateAccount } from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";

const formatOptions = [
    { value: "online", content: "Онлайн (Zoom / Google Meet)" },
    { value: "offline", content: "Очно" },
    { value: "both", content: "Онлайн и Очно" },
];

type SubjectDraft = { name: string; price: string; duration: string };
const DEFAULT_SUBJECT: SubjectDraft = { name: "", price: "", duration: "60" };

const FormField = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
    <div style={full ? { gridColumn: "1 / -1" } : undefined}>
        <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 6 }}>{label}</Text>
        {children}
    </div>
);

const Account = () => {
    const { user, refreshUser } = useAuth();
    const { data: settings, mutate: mutateSettings } = useSettings();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [vk, setVk] = useState("");
    const [website, setWebsite] = useState("");
    const [tagline, setTagline] = useState("");
    const [about, setAbout] = useState("");
    const [format, setFormat] = useState("online");
    const [offlineAddress, setOfflineAddress] = useState("");
    const [subjects, setSubjects] = useState<SubjectDraft[]>([DEFAULT_SUBJECT]);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    useEffect(() => {
        setName(settings?.name || user?.name || "");
        setEmail(settings?.email || user?.email || "");
        setPhone(settings?.phone || user?.phone || "");
        setWhatsapp(settings?.whatsapp || user?.whatsapp || "");
        setAbout(settings?.aboutText || (user as any)?.aboutText || "");
        setVk(settings?.vk || "");
        setWebsite(settings?.website || "");
        setTagline(settings?.tagline || "");
        setOfflineAddress(settings?.offlineAddress || "");
        setFormat(settings?.format || "online");
        const details = settings?.subjectDetails as SubjectDraft[] | null;
        if (details && Array.isArray(details) && details.length > 0) {
            setSubjects(details);
        } else {
            const names = (settings?.subjects || user?.subjects || []).filter((s: string) => !!s?.trim());
            if (names.length > 0) setSubjects(names.map((s: string) => ({ name: s, price: "", duration: "60" })));
            else setSubjects([DEFAULT_SUBJECT]);
        }
    }, [settings?.name, settings?.email, settings?.phone, settings?.whatsapp, settings?.aboutText,
        settings?.vk, settings?.website, settings?.tagline, settings?.format, settings?.offlineAddress,
        settings?.subjectDetails, settings?.subjects, user?.id, user?.name, user?.email, user?.phone, user?.whatsapp]);

    const addSubject = () => setSubjects([...subjects, { name: "", price: "", duration: "60" }]);
    const removeSubject = (i: number) => setSubjects(subjects.filter((_, idx) => idx !== i));
    const updateSubject = (i: number, field: "name" | "price" | "duration", v: string) => {
        const updated = [...subjects]; updated[i] = { ...updated[i], [field]: v }; setSubjects(updated);
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true); setSaveMsg(null);
        try {
            await updateAccount({
                name: name.trim(), phone: phone.trim(), whatsapp: whatsapp.trim(),
                aboutText: about.trim(), subjects: subjects.map((s) => s.name.trim()).filter(Boolean),
                subjectDetails: subjects.filter((s) => s.name.trim()),
                vk: vk.trim(), website: website.trim(), tagline: tagline.trim(),
                format, offlineAddress: offlineAddress.trim(),
            });
            await Promise.all([mutateSettings(), refreshUser()]);
            setSaveMsg("Сохранено");
        } catch (e: any) {
            setSaveMsg(codedErrorMessage("SETT-ACC-SAVE", e));
        } finally { setSaving(false); }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Account data */}
            <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Данные аккаунта</Text>
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <FormField label="ФИО">
                            <TextInput value={name} onUpdate={setName} placeholder="Смирнов Алексей Иванович" size="m" />
                        </FormField>
                        <FormField label="Email">
                            <TextInput value={email} disabled placeholder="email@example.com" size="m" />
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>
                                Изменение email пока недоступно
                            </Text>
                        </FormField>
                        <FormField label="Телефон">
                            <TextInput type="tel" value={phone} onUpdate={setPhone} placeholder="+7 900 123-45-67" size="m" />
                        </FormField>
                        <FormField label="WhatsApp">
                            <TextInput type="tel" value={whatsapp} onUpdate={setWhatsapp} placeholder="+79001234567" size="m" />
                        </FormField>
                        <FormField label="ВКонтакте">
                            <TextInput value={vk} onUpdate={setVk} placeholder="https://vk.com/username" size="m" />
                        </FormField>
                        <FormField label="Сайт">
                            <TextInput value={website} onUpdate={setWebsite} placeholder="https://my-site.ru" size="m" />
                        </FormField>
                        <FormField label="Подзаголовок (для публичной страницы)" full>
                            <TextInput value={tagline} onUpdate={setTagline} placeholder="Репетитор по математике и физике" size="m" />
                        </FormField>
                        <FormField label="О себе" full>
                            <TextArea value={about} onUpdate={setAbout} placeholder="Подробная информация о вашем опыте, подходе, достижениях..." rows={4} size="m" />
                        </FormField>
                    </div>
                </div>
            </Card>

            {/* Subjects & prices */}
            <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--g-color-line-generic)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Text variant="subheader-2">Предметы и цены</Text>
                    <Button view="outlined" size="s" onClick={addSubject}>
                        <Icon data={Plus as IconData} size={14} />
                        Добавить
                    </Button>
                </div>
                <div style={{ padding: 24 }}>
                    {subjects.length === 0 ? (
                        <div style={{ padding: "32px 0", textAlign: "center" }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
                                background: "rgba(174,122,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Icon data={Plus as IconData} size={24} />
                            </div>
                            <Text variant="body-1" color="secondary">Добавьте хотя бы один предмет</Text>
                            <div style={{ marginTop: 12 }}>
                                <Button view="action" size="s" onClick={addSubject}>Добавить предмет</Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Table header */}
                            <div style={{
                                display: "grid", gridTemplateColumns: "1fr 120px 100px 36px", gap: 12,
                                padding: "0 12px 10px", borderBottom: "1px solid var(--g-color-line-generic)",
                            }}>
                                <Text variant="caption-2" color="secondary">Предмет</Text>
                                <Text variant="caption-2" color="secondary">Цена за час</Text>
                                <Text variant="caption-2" color="secondary">Длительность</Text>
                                <span />
                            </div>
                            {/* Rows */}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {subjects.map((subj, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "grid", gridTemplateColumns: "1fr 120px 100px 36px", gap: 12,
                                            alignItems: "center", padding: "10px 12px",
                                            borderRadius: 10, transition: "background 0.12s",
                                            borderBottom: i < subjects.length - 1 ? "1px solid var(--g-color-line-generic)" : undefined,
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(174,122,255,0.03)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <TextInput
                                            value={subj.name}
                                            onUpdate={(v) => updateSubject(i, "name", v)}
                                            placeholder="Математика"
                                            size="m"
                                            view="clear"
                                            style={{ fontWeight: 500 }}
                                        />
                                        <div style={{ position: "relative" }}>
                                            <TextInput
                                                value={subj.price}
                                                onUpdate={(v) => updateSubject(i, "price", v)}
                                                placeholder="2 100"
                                                size="m"
                                                view="clear"
                                            />
                                            <span style={{
                                                position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                                                fontSize: 13, color: "var(--g-color-text-secondary)", pointerEvents: "none",
                                            }}>₽</span>
                                        </div>
                                        <div style={{ position: "relative" }}>
                                            <TextInput
                                                value={subj.duration}
                                                onUpdate={(v) => updateSubject(i, "duration", v)}
                                                placeholder="60"
                                                size="m"
                                                view="clear"
                                            />
                                            <span style={{
                                                position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                                                fontSize: 13, color: "var(--g-color-text-secondary)", pointerEvents: "none",
                                            }}>мин</span>
                                        </div>
                                        <Button
                                            view="flat"
                                            size="s"
                                            onClick={() => removeSubject(i)}
                                            style={{ opacity: 0.4, transition: "opacity 0.15s" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
                                        >
                                            <Icon data={Xmark as IconData} size={15} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Format */}
            <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Формат занятий</Text>
                </div>
                <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <FormField label="Формат">
                        <Select options={formatOptions} value={[format]} onUpdate={(v) => setFormat(v[0])} size="m" width="max" />
                    </FormField>
                    {(format === "offline" || format === "both") && (
                        <FormField label="Адрес (очно)">
                            <TextInput value={offlineAddress} onUpdate={setOfflineAddress} placeholder="Москва, м. Тверская" size="m" />
                        </FormField>
                    )}
                </div>
            </Card>

            {/* Save */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                {saveMsg && (
                    <Text variant="body-1" style={{ fontWeight: 600, color: saveMsg === "Сохранено" ? "var(--g-color-text-positive)" : "var(--g-color-text-danger)" }}>
                        {saveMsg}
                    </Text>
                )}
                <Button view="action" size="l" onClick={handleSave} disabled={saving}>
                    {saving ? "Сохраняем..." : "Сохранить изменения"}
                </Button>
            </div>
        </div>
    );
};

export default Account;
