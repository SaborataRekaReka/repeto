import { useEffect, useState, useRef } from "react";
import { Alert, Card, Text, Button, Icon, TextInput, TextArea, Select, Switch, Loader } from "@gravity-ui/uikit";
import { Plus, TrashBin, ChevronDown, FileArrowUp } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { useAuth } from "@/contexts/AuthContext";
import {
    useSettings,
    updateAccount,
    uploadCertificate,
    deleteCertificate,
} from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";
import PhoneInput from "@/components/PhoneInput";
import AppField from "@/components/AppField";
import AppSelect from "@/components/AppSelect";
import { resolveApiAssetUrl } from "@/lib/api";

const formatOptions = [
    { value: "online", content: "Онлайн (Zoom / Google Meet)" },
    { value: "offline", content: "Очно" },
    { value: "both", content: "Онлайн и Очно" },
];

type SubjectDraft = { name: string; price: string; duration: string };
const DEFAULT_SUBJECT: SubjectDraft = { name: "", price: "", duration: "60" };

type EducationEntry = { institution: string; program: string; years: string };
type CertificateEntry = { id: string; title: string; fileUrl: string; uploadedAt: string };

function isPdfUrl(value?: string | null): boolean {
    const normalized = String(value || "").split("?")[0].toLowerCase();
    return normalized.endsWith(".pdf");
}

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

function getSavedPaymentRequisites(settings: any): string {
    const direct = typeof settings?.paymentRequisites === "string"
        ? settings.paymentRequisites.trim()
        : "";

    if (direct) {
        return direct;
    }

    const nested = settings?.paymentSettings?.studentPaymentDetails?.requisites;
    return typeof nested === "string" ? nested.trim() : "";
}

function summarizePaymentRequisites(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }

    const digits = (trimmed.match(/\d/g) || []).join("");
    if (digits.length >= 4) {
        return `*${digits.slice(-4)}`;
    }

    const firstLine = trimmed
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);

    if (!firstLine) {
        return "";
    }

    return firstLine.length > 18 ? `${firstLine.slice(0, 18).trimEnd()}…` : firstLine;
}

function extractCardNumber(value: string): string {
    const matches = value.match(/(?:\d[\s-]*){16,20}/g) || [];
    for (const match of matches) {
        const digits = match.match(/\d/g)?.join("") || "";
        if (digits.length >= 16 && digits.length <= 20) {
            const chunks = digits.match(/.{1,4}/g);
            return chunks ? chunks.join(" ") : digits;
        }
    }
    return "";
}

function extractSbpPhone(value: string): string {
    const sbpLine = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => /сбп/i.test(line));

    if (sbpLine) {
        return sbpLine;
    }

    const match = value.match(/(?:\+7|8)[\d\s().-]{9,20}\d/);
    return match ? match[0].trim() : "";
}

function getSavedPaymentCardNumber(settings: any): string {
    const direct = typeof settings?.paymentCardNumber === "string"
        ? settings.paymentCardNumber.trim()
        : "";

    if (direct) {
        return direct;
    }

    const nested = settings?.paymentSettings?.studentPaymentDetails;
    const fromNested = typeof nested?.cardNumber === "string"
        ? nested.cardNumber.trim()
        : typeof nested?.card === "string"
            ? nested.card.trim()
            : "";

    if (fromNested) {
        return fromNested;
    }

    return extractCardNumber(getSavedPaymentRequisites(settings));
}

function getSavedPaymentSbpPhone(settings: any): string {
    const direct = typeof settings?.paymentSbpPhone === "string"
        ? settings.paymentSbpPhone.trim()
        : "";

    if (direct) {
        return direct;
    }

    const nested = settings?.paymentSettings?.studentPaymentDetails;
    const fromNested = typeof nested?.sbpPhone === "string"
        ? nested.sbpPhone.trim()
        : typeof nested?.sbp === "string"
            ? nested.sbp.trim()
            : "";

    if (fromNested) {
        return fromNested;
    }

    return extractSbpPhone(getSavedPaymentRequisites(settings));
}

const FormField = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
    <AppField label={label} style={full ? { gridColumn: "1 / -1" } : undefined}>
        {children}
    </AppField>
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
    const [paymentRequisites, setPaymentRequisites] = useState("");
    const [paymentCardNumber, setPaymentCardNumber] = useState("");
    const [paymentSbpPhone, setPaymentSbpPhone] = useState("");
    const [format, setFormat] = useState("online");
    const [offlineAddress, setOfflineAddress] = useState("");
    const [subjects, setSubjects] = useState<SubjectDraft[]>([DEFAULT_SUBJECT]);
    const [savedSubjectFlags, setSavedSubjectFlags] = useState<boolean[]>([false]);
    const [expandedSubjectIndex, setExpandedSubjectIndex] = useState<number | null>(0);
    const [pendingDeleteSubjectIndex, setPendingDeleteSubjectIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [showPublicPackages, setShowPublicPackages] = useState(true);
    const [education, setEducation] = useState<EducationEntry[]>([]);
    const [experience, setExperience] = useState("");
    const [qualificationVerified, setQualificationVerified] = useState(false);
    const [qualificationLabel, setQualificationLabel] = useState("");
    const [certificates, setCertificates] = useState<CertificateEntry[]>([]);
    const [certUploading, setCertUploading] = useState(false);
    const certInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(settings?.name || user?.name || "");
        setEmail(settings?.email || user?.email || "");
        setPhone(settings?.phone || user?.phone || "");
        setWhatsapp(settings?.whatsapp || user?.whatsapp || "");
        setAbout(settings?.aboutText || (user as any)?.aboutText || "");
        setPaymentRequisites(getSavedPaymentRequisites(settings));
        setPaymentCardNumber(getSavedPaymentCardNumber(settings));
        setPaymentSbpPhone(getSavedPaymentSbpPhone(settings));
        setVk(settings?.vk || "");
        setWebsite(settings?.website || "");
        setTagline(settings?.tagline || "");
        setOfflineAddress(settings?.offlineAddress || "");
        setFormat(settings?.format || "online");
        setShowPublicPackages(settings?.showPublicPackages !== false);
        setExperience(settings?.experience || "");
        setQualificationVerified(settings?.qualificationVerified || false);
        setQualificationLabel(settings?.qualificationLabel || "");
        const eduData = settings?.education as EducationEntry[] | null;
        if (eduData && Array.isArray(eduData) && eduData.length > 0) {
            setEducation(eduData);
        } else {
            setEducation([]);
        }
        const certData = settings?.certificates as CertificateEntry[] | null;
        if (certData && Array.isArray(certData) && certData.length > 0) {
            setCertificates(certData);
        } else {
            setCertificates([]);
        }
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
                setSubjects([]);
                setSavedSubjectFlags([]);
            }
        }
    }, [settings?.name, settings?.email, settings?.phone, settings?.whatsapp, settings?.aboutText,
        settings?.paymentRequisites, settings?.paymentCardNumber, settings?.paymentSbpPhone,
        settings?.vk, settings?.website, settings?.tagline,
        settings?.format, settings?.offlineAddress, settings?.subjectDetails, settings?.subjects,
        user?.id, user?.name, user?.email, user?.phone, user?.whatsapp]);

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
                paymentRequisites: paymentRequisites.trim(),
                paymentCardNumber: paymentCardNumber.trim(),
                paymentSbpPhone: paymentSbpPhone.trim(),
                vk: vk.trim(), website: website.trim(), tagline: tagline.trim(),
                format, offlineAddress: offlineAddress.trim(),
                showPublicPackages,
                education: education.filter((e) => e.institution.trim()),
                experience: experience.trim(),
                qualificationVerified,
                qualificationLabel: qualificationLabel.trim(),
            });
            await Promise.all([mutateSettings(), refreshUser()]);
            setSavedSubjectFlags(subjects.map((s) => Boolean(s.name.trim())));
            setExpandedSubjectIndex(null);
            setSaveMsg("Сохранено");
        } catch (e: any) {
            setSaveMsg(codedErrorMessage("SETT-ACC-SAVE", e));
        } finally { setSaving(false); }
    };

    const paymentRequisitesPreview = summarizePaymentRequisites(paymentRequisites);

    return (
        <div className="repeto-settings-account-stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Account data */}
            <Card className="repeto-settings-section-card" view="outlined">
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
                            <PhoneInput value={phone} onUpdate={setPhone} />
                        </FormField>
                        <FormField label="WhatsApp">
                            <PhoneInput value={whatsapp} onUpdate={setWhatsapp} />
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
                        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
                            <div>
                                <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>Показывать публичные пакеты</Text>
                                <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 2 }}>
                                    Если выключено, раздел с пакетами не отображается на публичной странице и в записи.
                                </Text>
                            </div>
                            <Switch checked={showPublicPackages} onUpdate={setShowPublicPackages} size="m" />
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="repeto-settings-section-card" view="outlined">
                <div className="repeto-settings-card__header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Оплата и реквизиты</Text>
                </div>
                <div className="repeto-settings-card__body" style={{ padding: 24 }}>
                    <div className="repeto-settings-account-grid">
                        <FormField label="Номер карты" full>
                            <TextInput
                                value={paymentCardNumber}
                                onUpdate={setPaymentCardNumber}
                                placeholder="2200 1234 5678 9567"
                                size="l"
                            />
                        </FormField>

                        <FormField label="Номер телефона для СБП" full>
                            <PhoneInput
                                value={paymentSbpPhone}
                                onUpdate={setPaymentSbpPhone}
                            />
                        </FormField>

                        <FormField label="Реквизиты для учеников" full>
                            <TextArea
                                value={paymentRequisites}
                                onUpdate={setPaymentRequisites}
                                placeholder={"СБП: +7 999 123-45-67\nКарта: 2200 1234 5678 9567\nПолучатель: Иванов Иван Иванович"}
                                rows={5}
                                size="l"
                            />
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 6 }}>
                                Эти реквизиты откроются ученику в модалке по кнопке «Реквизиты счета». Если поле пустое, кнопка в портале не показывается.
                            </Text>
                            {paymentRequisitesPreview && (
                                <Text variant="caption-2" style={{ display: "block", marginTop: 6, color: "var(--g-color-text-brand)" }}>
                                    Короткая подпись в портале: {paymentRequisitesPreview}
                                </Text>
                            )}
                        </FormField>
                    </div>
                </div>
            </Card>

            {/* Subjects & prices */}
            <Card className="repeto-settings-section-card" view="outlined">
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
                            <Text variant="body-1" color="secondary">Добавьте предметы</Text>
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
            <Card className="repeto-settings-section-card" view="outlined">
                <div className="repeto-settings-card__header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Формат занятий</Text>
                </div>
                <div className="repeto-settings-card__body repeto-settings-format-grid" style={{ padding: 24 }}>
                    <AppSelect
                        label="Формат"
                        options={formatOptions}
                        value={[format]}
                        onUpdate={(v) => setFormat(v[0])}
                        size="l"
                        width="max"
                    />
                    {(format === "offline" || format === "both") && (
                        <FormField label="Адрес (очно)">
                            <TextInput value={offlineAddress} onUpdate={setOfflineAddress} placeholder="Москва, м. Тверская" size="l" />
                        </FormField>
                    )}
                </div>
            </Card>

            {/* Education */}
            <Card className="repeto-settings-section-card" view="outlined">
                <div className="repeto-settings-card__header" style={{ padding: "16px 24px", borderBottom: "1px solid var(--g-color-line-generic)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Text variant="subheader-2">Образование</Text>
                    <Button view="outlined" size="s" onClick={() => setEducation((prev) => [...prev, { institution: "", program: "", years: "" }])}>
                        <Icon data={Plus as IconData} size={14} />
                        Добавить
                    </Button>
                </div>
                <div className="repeto-settings-card__body" style={{ padding: 24 }}>
                    {education.length === 0 ? (
                        <Text variant="body-1" color="secondary" style={{ textAlign: "center", padding: "16px 0" }}>
                            Укажите ваше образование — оно отобразится на публичной странице
                        </Text>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {education.map((edu, i) => (
                                <div key={i} className="repeto-settings-account-grid" style={{ position: "relative", paddingBottom: 8, borderBottom: i < education.length - 1 ? "1px solid var(--g-color-line-generic)" : "none" }}>
                                    <FormField label="Учебное заведение" full>
                                        <TextInput value={edu.institution} onUpdate={(v) => { const u = [...education]; u[i] = { ...u[i], institution: v }; setEducation(u); }} placeholder="МГУ им. М.В. Ломоносова" size="l" />
                                    </FormField>
                                    <FormField label="Специальность / программа">
                                        <TextInput value={edu.program} onUpdate={(v) => { const u = [...education]; u[i] = { ...u[i], program: v }; setEducation(u); }} placeholder="Филология" size="l" />
                                    </FormField>
                                    <FormField label="Годы обучения">
                                        <TextInput value={edu.years} onUpdate={(v) => { const u = [...education]; u[i] = { ...u[i], years: v }; setEducation(u); }} placeholder="2015–2020" size="l" />
                                    </FormField>
                                    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                                        <Button view="flat-danger" size="s" onClick={() => setEducation((prev) => prev.filter((_, idx) => idx !== i))}>
                                            <Icon data={TrashBin as IconData} size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Experience & Qualification */}
            <Card className="repeto-settings-section-card" view="outlined">
                <div className="repeto-settings-card__header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Опыт и квалификация</Text>
                </div>
                <div className="repeto-settings-card__body" style={{ padding: 24 }}>
                    <div className="repeto-settings-account-grid">
                        <FormField label="Опыт работы" full>
                            <TextArea value={experience} onUpdate={setExperience} placeholder="Опишите ваш опыт преподавания, достижения, стаж..." rows={3} size="l" />
                        </FormField>
                        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
                            <div>
                                <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>Подтверждена квалификация</Text>
                                <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 2 }}>
                                    Отображает специальный значок на публичной странице
                                </Text>
                            </div>
                            <Switch checked={qualificationVerified} onUpdate={setQualificationVerified} size="m" />
                        </div>
                        {qualificationVerified && (
                            <FormField label="Подпись значка" full>
                                <TextInput value={qualificationLabel} onUpdate={setQualificationLabel} placeholder="Подтвердил квалификацию" size="l" />
                            </FormField>
                        )}
                    </div>
                </div>
            </Card>

            {/* Certificates */}
            <Card className="repeto-settings-section-card" view="outlined">
                <div className="repeto-settings-card__header" style={{ padding: "16px 24px", borderBottom: "1px solid var(--g-color-line-generic)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Text variant="subheader-2">Документы и сертификаты</Text>
                    <Button view="outlined" size="s" onClick={() => certInputRef.current?.click()} disabled={certUploading}>
                        <Icon data={FileArrowUp as IconData} size={14} />
                        {certUploading ? "Загрузка..." : "Загрузить"}
                    </Button>
                    <input
                        ref={certInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setCertUploading(true);
                            try {
                                const cert = await uploadCertificate(file, file.name);
                                setCertificates((prev) => [...prev, cert]);
                                await mutateSettings();
                            } catch {
                                setSaveMsg("Ошибка загрузки файла");
                            } finally {
                                setCertUploading(false);
                                if (certInputRef.current) certInputRef.current.value = "";
                            }
                        }}
                    />
                </div>
                <div className="repeto-settings-card__body" style={{ padding: 24 }}>
                    {certificates.length === 0 ? (
                        <Text variant="body-1" color="secondary" style={{ textAlign: "center", padding: "16px 0" }}>
                            Загрузите сертификаты, дипломы или другие документы
                        </Text>
                    ) : (
                        <div className="repeto-settings-certs-grid">
                            {certificates.map((cert) => (
                                <div key={cert.id} className="repeto-settings-cert-card">
                                    <div className="repeto-settings-cert-card__preview">
                                        {isPdfUrl(cert.fileUrl) ? (
                                            <div className="repeto-settings-cert-card__pdf">PDF</div>
                                        ) : (
                                            <img
                                                src={resolveApiAssetUrl(cert.fileUrl) || cert.fileUrl}
                                                alt={cert.title}
                                            />
                                        )}
                                    </div>
                                    <div className="repeto-settings-cert-card__info">
                                        <Text variant="caption-2" ellipsis title={cert.title}>{cert.title}</Text>
                                        <Button
                                            view="flat-danger"
                                            size="xs"
                                            onClick={async () => {
                                                try {
                                                    await deleteCertificate(cert.id);
                                                    setCertificates((prev) => prev.filter((c) => c.id !== cert.id));
                                                    await mutateSettings();
                                                } catch {
                                                    setSaveMsg("Ошибка удаления");
                                                }
                                            }}
                                        >
                                            <Icon data={TrashBin as IconData} size={12} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Save */}
            <div className="repeto-settings-savebar">
                {saveMsg && (
                    <Text variant="body-1" className={`repeto-settings-savebar__message${saveMsg === "Сохранено" ? " repeto-settings-savebar__message--ok" : " repeto-settings-savebar__message--error"}`}>
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
