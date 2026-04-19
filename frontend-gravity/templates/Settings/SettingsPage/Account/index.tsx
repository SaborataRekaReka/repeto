import { useEffect, useState } from "react";
import { Alert, Card, Text, Button, Icon, TextInput, TextArea, Select } from "@gravity-ui/uikit";
import { Plus, TrashBin, ChevronDown } from "@gravity-ui/icons";
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

function formatSubjectPrice(value: string): string {
    const normalized = String(value || "").replace(/\s+/g, "").replace(",", ".");
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return "—";
    }
    return `${Math.round(numeric).toLocaleString("ru-RU")} ₽`;
}

function formatSubjectDuration(value: string): string {
    const numeric = Number(String(value || "").replace(/\s+/g, ""));
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return "—";
    }
    return `${Math.round(numeric)} мин`;
}

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
    const [savedSubjectFlags, setSavedSubjectFlags] = useState<boolean[]>([false]);
    const [expandedSubjectIndex, setExpandedSubjectIndex] = useState<number | null>(0);
    const [pendingDeleteSubjectIndex, setPendingDeleteSubjectIndex] = useState<number | null>(null);
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
            setSavedSubjectFlags(details.map(() => true));
        } else {
            const names = (settings?.subjects || user?.subjects || []).filter((s: string) => !!s?.trim());
            if (names.length > 0) {
                const mapped = names.map((s: string) => ({ name: s, price: "", duration: "60" }));
                setSubjects(mapped);
                setSavedSubjectFlags(mapped.map(() => true));
            } else {
                setSubjects([DEFAULT_SUBJECT]);
                setSavedSubjectFlags([false]);
            }
        }
    }, [settings?.name, settings?.email, settings?.phone, settings?.whatsapp, settings?.aboutText,
        settings?.vk, settings?.website, settings?.tagline, settings?.format, settings?.offlineAddress,
        settings?.subjectDetails, settings?.subjects, user?.id, user?.name, user?.email, user?.phone, user?.whatsapp]);

    useEffect(() => {
        if (subjects.length === 0) {
            setExpandedSubjectIndex(null);
            setPendingDeleteSubjectIndex(null);
            return;
        }

        setExpandedSubjectIndex((prev) => {
            if (prev === null) {
                return 0;
            }
            return Math.min(prev, subjects.length - 1);
        });

        setPendingDeleteSubjectIndex((prev) => {
            if (prev === null) {
                return null;
            }
            return prev > subjects.length - 1 ? null : prev;
        });
    }, [subjects.length]);

    const addSubject = () => {
        const next = [...subjects, { name: "", price: "", duration: "60" }];
        const newIndex = next.length - 1;
        setSubjects(next);
        setSavedSubjectFlags((prev) => [...prev, false]);
        setExpandedSubjectIndex(newIndex);
        setPendingDeleteSubjectIndex(null);
    };

    const removeSubject = (i: number) => {
        const next = subjects.filter((_, idx) => idx !== i);
        setSubjects(next);
        setSavedSubjectFlags((prev) => prev.filter((_, idx) => idx !== i));
        if (next.length === 0) {
            setExpandedSubjectIndex(null);
            setPendingDeleteSubjectIndex(null);
            return;
        }
        setExpandedSubjectIndex((prev) => {
            if (prev === null) {
                return 0;
            }
            if (prev === i) {
                return Math.min(i, next.length - 1);
            }
            if (prev > i) {
                return prev - 1;
            }
            return prev;
        });

        setPendingDeleteSubjectIndex((prev) => {
            if (prev === null) {
                return null;
            }
            if (prev === i) {
                return null;
            }
            if (prev > i) {
                return prev - 1;
            }
            return prev;
        });
    };

    const updateSubject = (i: number, field: "name" | "price" | "duration", v: string) => {
        const updated = [...subjects]; updated[i] = { ...updated[i], [field]: v }; setSubjects(updated);
    };

    const toggleSubjectExpanded = (index: number) => {
        setExpandedSubjectIndex((prev) => (prev === index ? null : index));
        setPendingDeleteSubjectIndex(null);
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true); setSaveMsg(null);
        try {
            await updateAccount({
                name: name.trim(), phone: phone.trim(), whatsapp: whatsapp.trim(),
                aboutText: about.trim(), subjects: subjects.map((s) => s.name.trim()).filter(Boolean),
                subjectDetails: subjects
                    .filter((s) => s.name.trim())
                    .map((s) => ({ name: s.name.trim(), price: s.price, duration: s.duration })),
                vk: vk.trim(), website: website.trim(), tagline: tagline.trim(),
                format, offlineAddress: offlineAddress.trim(),
            });
            await Promise.all([mutateSettings(), refreshUser()]);
            setSavedSubjectFlags(subjects.map((s) => Boolean(s.name.trim())));
            setSaveMsg("Сохранено");
        } catch (e: any) {
            setSaveMsg(codedErrorMessage("SETT-ACC-SAVE", e));
        } finally { setSaving(false); }
    };

    return (
        <div className="repeto-settings-account-stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Account data */}
            <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
                <div className="repeto-settings-card__header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Данные аккаунта</Text>
                </div>
                <div className="repeto-settings-card__body" style={{ padding: 24 }}>
                    <div className="repeto-settings-account-grid">
                        <FormField label="ФИО">
                            <TextInput value={name} onUpdate={setName} placeholder="Смирнов Алексей Иванович" size="l" />
                        </FormField>
                        <FormField label="Email">
                            <TextInput value={email} disabled placeholder="email@example.com" size="l" />
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>
                                Изменение email пока недоступно
                            </Text>
                        </FormField>
                        <FormField label="Телефон">
                            <TextInput type="tel" value={phone} onUpdate={setPhone} placeholder="+7 900 123-45-67" size="l" />
                        </FormField>
                        <FormField label="WhatsApp">
                            <TextInput type="tel" value={whatsapp} onUpdate={setWhatsapp} placeholder="+79001234567" size="l" />
                        </FormField>
                        <FormField label="ВКонтакте">
                            <TextInput value={vk} onUpdate={setVk} placeholder="https://vk.com/username" size="l" />
                        </FormField>
                        <FormField label="Сайт">
                            <TextInput value={website} onUpdate={setWebsite} placeholder="https://my-site.ru" size="l" />
                        </FormField>
                        <FormField label="Подзаголовок (для публичной страницы)" full>
                            <TextInput value={tagline} onUpdate={setTagline} placeholder="Репетитор по математике и физике" size="l" />
                        </FormField>
                        <FormField label="О себе" full>
                            <TextArea value={about} onUpdate={setAbout} placeholder="Подробная информация о вашем опыте, подходе, достижениях..." rows={4} size="l" />
                        </FormField>
                    </div>
                </div>
            </Card>

            {/* Subjects & prices */}
            <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
                <div className="repeto-settings-card__header repeto-settings-subjects-header" style={{ padding: "16px 24px", borderBottom: "1px solid var(--g-color-line-generic)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Text variant="subheader-2">Предметы и цены</Text>
                    <Button view="outlined" size="s" onClick={addSubject}>
                        <Icon data={Plus as IconData} size={14} />
                        Добавить
                    </Button>
                </div>
                <div className="repeto-settings-card__body" style={{ padding: 24 }}>
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
                        <div className="repeto-subjects-accordion">
                            {subjects.map((subj, i) => {
                                const isOpen = expandedSubjectIndex === i;
                                const isSavedSubject = Boolean(savedSubjectFlags[i]);
                                const showDeleteConfirm = isSavedSubject && pendingDeleteSubjectIndex === i;

                                return (
                                    <div key={`accordion-${i}`} className="repeto-subjects-accordion__item">
                                        <button
                                            type="button"
                                            className="repeto-subjects-accordion__header"
                                            onClick={() => toggleSubjectExpanded(i)}
                                        >
                                            <div className="repeto-subjects-accordion__summary">
                                                <Text variant="body-1" style={{ fontWeight: 600 }}>
                                                    {subj.name || `Предмет ${i + 1}`}
                                                </Text>
                                                <Text variant="caption-2" color="secondary">
                                                    {`${formatSubjectPrice(subj.price)} · ${formatSubjectDuration(subj.duration)}`}
                                                </Text>
                                            </div>
                                            <Icon
                                                data={ChevronDown as IconData}
                                                size={18}
                                                className={`repeto-subjects-accordion__caret ${isOpen ? "repeto-subjects-accordion__caret--open" : ""}`}
                                            />
                                        </button>

                                        {isOpen && (
                                            <div className="repeto-subjects-accordion__body">
                                                <div className="repeto-subjects-accordion__fields">
                                                    <FormField label="Предмет">
                                                        <TextInput
                                                            value={subj.name}
                                                            onUpdate={(v) => updateSubject(i, "name", v)}
                                                            placeholder="Математика"
                                                            size="l"
                                                        />
                                                    </FormField>

                                                    <FormField label="Цена за час">
                                                        <div className="repeto-settings-subjects-row__price">
                                                            <TextInput
                                                                value={subj.price}
                                                                onUpdate={(v) => updateSubject(i, "price", v)}
                                                                placeholder="2 100"
                                                                size="l"
                                                                endContent={
                                                                    <span style={{
                                                                        padding: "0 10px",
                                                                        color: "var(--g-color-text-secondary)",
                                                                        fontSize: 13,
                                                                        pointerEvents: "none",
                                                                        userSelect: "none",
                                                                        whiteSpace: "nowrap",
                                                                    }}>
                                                                        ₽
                                                                    </span>
                                                                }
                                                            />
                                                        </div>
                                                    </FormField>

                                                    <FormField label="Длительность">
                                                        <div className="repeto-settings-subjects-row__duration">
                                                            <TextInput
                                                                value={subj.duration}
                                                                onUpdate={(v) => updateSubject(i, "duration", v)}
                                                                placeholder="60"
                                                                size="l"
                                                                endContent={
                                                                    <span style={{
                                                                        padding: "0 10px",
                                                                        color: "var(--g-color-text-secondary)",
                                                                        fontSize: 13,
                                                                        pointerEvents: "none",
                                                                        userSelect: "none",
                                                                        whiteSpace: "nowrap",
                                                                    }}>
                                                                        мин
                                                                    </span>
                                                                }
                                                            />
                                                        </div>
                                                    </FormField>
                                                </div>

                                                {!showDeleteConfirm ? (
                                                    <div className="repeto-subjects-accordion__actions">
                                                        <Button view="action" size="s" onClick={handleSave} disabled={saving}>
                                                            {saving ? "Сохраняем..." : "Сохранить"}
                                                        </Button>
                                                        <Button
                                                            view="outlined-danger"
                                                            size="s"
                                                            onClick={() => {
                                                                if (!isSavedSubject) {
                                                                    removeSubject(i);
                                                                    return;
                                                                }
                                                                setPendingDeleteSubjectIndex(i);
                                                            }}
                                                            disabled={saving}
                                                        >
                                                            <Icon data={TrashBin as IconData} size={14} />
                                                            Удалить предмет
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Alert
                                                        theme="danger"
                                                        view="filled"
                                                        corners="rounded"
                                                        title="Подтвердите удаление предмета"
                                                        message={
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                                <div>Предмет будет удален без возможности восстановления.</div>
                                                                <div style={{ display: "flex", gap: 8 }}>
                                                                    <Button view="outlined-danger" size="s" onClick={() => removeSubject(i)}>
                                                                        <Icon data={TrashBin as IconData} size={14} />
                                                                        Да, удалить
                                                                    </Button>
                                                                    <Button view="outlined" size="s" onClick={() => setPendingDeleteSubjectIndex(null)}>
                                                                        Нет
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        }
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>

            {/* Format */}
            <Card view="outlined" style={{ background: "var(--g-color-base-float)" }}>
                <div className="repeto-settings-card__header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Формат занятий</Text>
                </div>
                <div className="repeto-settings-card__body repeto-settings-format-grid" style={{ padding: 24 }}>
                    <FormField label="Формат">
                        <Select options={formatOptions} value={[format]} onUpdate={(v) => setFormat(v[0])} size="l" width="max" />
                    </FormField>
                    {(format === "offline" || format === "both") && (
                        <FormField label="Адрес (очно)">
                            <TextInput value={offlineAddress} onUpdate={setOfflineAddress} placeholder="Москва, м. Тверская" size="l" />
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
                    {saving ? "Сохраняем..." : "Сохранить"}
                </Button>
            </div>
        </div>
    );
};

export default Account;
