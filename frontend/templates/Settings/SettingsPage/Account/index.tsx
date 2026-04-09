import { useEffect, useMemo, useState } from "react";
import Field from "@/components/Field";
import Select from "@/components/Select";
import Icon from "@/components/Icon";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, updateAccount } from "@/hooks/useSettings";

const formatOptions = [
    { id: "online", title: "Онлайн (Zoom / Google Meet)" },
    { id: "offline", title: "Очно" },
    { id: "both", title: "Онлайн и Очно" },
];

type SubjectDraft = {
    name: string;
    price: string;
    duration: string;
};

const DEFAULT_SUBJECT: SubjectDraft = { name: "", price: "", duration: "60" };

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
    const [format, setFormat] = useState<any>(formatOptions[0]);
    const [offlineAddress, setOfflineAddress] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    // Предметы с ценами
    const [subjects, setSubjects] = useState<SubjectDraft[]>([DEFAULT_SUBJECT]);

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
        setFormat(
            formatOptions.find((opt) => opt.id === (settings?.format)) ||
                formatOptions[0]
        );

        // Load subjects from subjectDetails (full objects) or subjects (names only)
        const details = settings?.subjectDetails as SubjectDraft[] | null;
        if (details && Array.isArray(details) && details.length > 0) {
            setSubjects(details);
        } else {
            const names = (settings?.subjects || user?.subjects || []).filter(
                (s: string) => !!s?.trim()
            );
            if (names.length > 0) {
                setSubjects(names.map((s: string) => ({ name: s, price: "", duration: "60" })));
            } else {
                setSubjects([DEFAULT_SUBJECT]);
            }
        }
    }, [
        settings?.name,
        settings?.email,
        settings?.phone,
        settings?.whatsapp,
        settings?.aboutText,
        settings?.vk,
        settings?.website,
        settings?.tagline,
        settings?.format,
        settings?.offlineAddress,
        settings?.subjectDetails,
        settings?.subjects,
        user?.id,
        user?.name,
        user?.email,
        user?.phone,
        user?.whatsapp,
    ]);

    const addSubject = () => {
        setSubjects([...subjects, { name: "", price: "", duration: "60" }]);
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const updateSubject = (
        index: number,
        field: "name" | "price" | "duration",
        value: string
    ) => {
        const updated = [...subjects];
        updated[index] = { ...updated[index], [field]: value };
        setSubjects(updated);
    };

    const handleSave = async () => {
        if (saving) return;

        setSaving(true);
        setSaveMsg(null);

        const subjectNames = subjects
            .map((s) => s.name.trim())
            .filter(Boolean);

        try {
            await updateAccount({
                name: name.trim(),
                phone: phone.trim(),
                whatsapp: whatsapp.trim(),
                aboutText: about.trim(),
                subjects: subjectNames,
                subjectDetails: subjects.filter((s) => s.name.trim()),
                vk: vk.trim(),
                website: website.trim(),
                tagline: tagline.trim(),
                format: format?.id || "online",
                offlineAddress: offlineAddress.trim(),
            });

            await Promise.all([mutateSettings(), refreshUser()]);
            setSaveMsg("Сохранено");
        } catch (e: any) {
            setSaveMsg(e?.message || "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
        <div className="card">
            <div className="card-title">Данные аккаунта</div>
            <div className="p-5">
                <div className="flex flex-wrap -mt-4 -mx-2.5">
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="ФИО"
                            type="text"
                            placeholder="Смирнов Алексей Иванович"
                            value={name}
                            onChange={(e: any) => setName(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="Email"
                            type="email"
                            placeholder="email@example.com"
                            icon="email"
                            value={email}
                            onChange={(e: any) => setEmail(e.target.value)}
                            classInput="opacity-60 cursor-not-allowed"
                        />
                        <div className="mt-1 text-[11px] text-n-3 dark:text-white/50">
                            Изменение email пока недоступно
                        </div>
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="Телефон"
                            type="tel"
                            placeholder="+7 900 123-45-67"
                            value={phone}
                            onChange={(e: any) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="WhatsApp"
                            type="tel"
                            placeholder="+79001234567"
                            value={whatsapp}
                            onChange={(e: any) => setWhatsapp(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="ВКонтакте"
                            type="url"
                            placeholder="https://vk.com/username"
                            icon="earth"
                            value={vk}
                            onChange={(e: any) => setVk(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="Сайт"
                            type="url"
                            placeholder="https://my-site.ru"
                            icon="earth"
                            value={website}
                            onChange={(e: any) => setWebsite(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(100%-1.25rem)]">
                        <Field
                            label="Подзаголовок (для публичной страницы)"
                            type="text"
                            placeholder="Репетитор по математике и физике"
                            value={tagline}
                            onChange={(e: any) => setTagline(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(100%-1.25rem)]">
                        <Field
                            label="О себе"
                            type="text"
                            placeholder="Подробная информация о вашем опыте, подходе, достижениях..."
                            value={about}
                            onChange={(e: any) => setAbout(e.target.value)}
                            textarea
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="card mt-4">
            <div className="card-head">
                <div className="card-title !p-0 !border-b-0">Предметы и цены</div>
                <button
                    className="btn-stroke btn-small"
                    onClick={addSubject}
                >
                    <Icon name="add-circle" />
                    <span>Добавить</span>
                </button>
            </div>
            <div className="p-5">
                {subjects.length === 0 ? (
                    <div className="py-6 text-center text-sm text-n-3 dark:text-white/50">
                        Добавьте хотя бы один предмет
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subjects.map((subj, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 border border-n-1 rounded-sm dark:border-white md:flex-wrap"
                            >
                                <div className="flex-1 min-w-[8rem]">
                                    <div className="text-xs text-n-3 dark:text-white/50 mb-0.5">
                                        Предмет
                                    </div>
                                    <input
                                        className="w-full h-10 px-3 border border-n-1 rounded-sm text-sm font-bold bg-white outline-none transition-colors focus:border-purple-1 dark:bg-n-1 dark:border-white dark:text-white dark:focus:border-purple-1"
                                        placeholder="Математика"
                                        value={subj.name}
                                        onChange={(e) =>
                                            updateSubject(
                                                i,
                                                "name",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="w-24 md:w-[calc(50%-0.5rem)]">
                                    <div className="text-xs text-n-3 dark:text-white/50 mb-0.5">
                                        Цена (₽)
                                    </div>
                                    <input
                                        className="w-full h-10 px-3 border border-n-1 rounded-sm text-sm font-bold bg-white outline-none transition-colors focus:border-purple-1 dark:bg-n-1 dark:border-white dark:text-white dark:focus:border-purple-1"
                                        type="number"
                                        placeholder="2100"
                                        value={subj.price}
                                        onChange={(e) =>
                                            updateSubject(
                                                i,
                                                "price",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className="w-20 md:w-[calc(50%-0.5rem)]">
                                    <div className="text-xs text-n-3 dark:text-white/50 mb-0.5">
                                        Минут
                                    </div>
                                    <input
                                        className="w-full h-10 px-3 border border-n-1 rounded-sm text-sm font-bold bg-white outline-none transition-colors focus:border-purple-1 dark:bg-n-1 dark:border-white dark:text-white dark:focus:border-purple-1"
                                        type="number"
                                        placeholder="60"
                                        value={subj.duration}
                                        onChange={(e) =>
                                            updateSubject(
                                                i,
                                                "duration",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <button
                                    className="btn-transparent-dark btn-square btn-small shrink-0"
                                    onClick={() => removeSubject(i)}
                                >
                                    <Icon name="close" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="card mt-4">
            <div className="card-title">Формат занятий</div>
            <div className="p-5">
                <div className="flex flex-wrap -mt-4 -mx-2.5">
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Select
                            label="Формат"
                            items={formatOptions}
                            value={format}
                            onChange={setFormat}
                        />
                    </div>
                    {(format?.id === "offline" ||
                        format?.id === "both") && (
                        <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                            <Field
                                label="Адрес (очно)"
                                type="text"
                                placeholder="Москва, м. Тверская"
                                value={offlineAddress}
                                onChange={(e: any) =>
                                    setOfflineAddress(e.target.value)
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex justify-end mt-6 md:block">
            <div className="flex items-center gap-3 md:block md:w-full">
                {saveMsg && (
                    <span
                        className={`text-xs font-bold md:block md:mb-2 ${
                            saveMsg === "Сохранено" ? "text-green-1" : "text-pink-1"
                        }`}
                    >
                        {saveMsg}
                    </span>
                )}
                <button
                    className="btn-purple min-w-[11.7rem] md:w-full"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Сохраняем..." : "Сохранить изменения"}
                </button>
            </div>
        </div>

        </>
    );
};

export default Account;
