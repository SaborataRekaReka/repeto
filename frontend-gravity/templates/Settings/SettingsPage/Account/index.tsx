import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    useSettings,
    updateAccount,
    uploadAvatar,
    uploadCertificate,
    deleteCertificate,
} from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";
import { resolveApiAssetUrl } from "@/lib/api";
import {
    SubjectDraft,
    EducationEntry,
    CertificateEntry,
    DEFAULT_SUBJECT,
    createDraftEducationId,
    getSavedPaymentRequisites,
    getSavedPaymentCardNumber,
    getSavedPaymentSbpPhone,
} from "./utils";
import PersonalDataSection from "./sections/PersonalData";
import PortraitSection from "./sections/Portrait";
import PaymentSection from "./sections/Payment";
import SubjectsSection from "./sections/Subjects";
import FormatSection from "./sections/Format";
import EducationSection from "./sections/Education";
import QualificationSection from "./sections/Qualification";
import CertificatesSection from "./sections/Certificates";
import SaveBar from "./SaveBar";

const Account = () => {
    const { user, refreshUser } = useAuth();
    const { data: settings, mutate: mutateSettings } = useSettings();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [vk, setVk] = useState("");
    const [website, setWebsite] = useState("");
    const [about, setAbout] = useState("");
    const [paymentRequisites, setPaymentRequisites] = useState("");
    const [paymentCardNumber, setPaymentCardNumber] = useState("");
    const [paymentSbpPhone, setPaymentSbpPhone] = useState("");
    const [format, setFormat] = useState("online");
    const [offlineAddress, setOfflineAddress] = useState("");
    const [subjects, setSubjects] = useState<SubjectDraft[]>([DEFAULT_SUBJECT]);
    const [savedSubjectFlags, setSavedSubjectFlags] = useState<boolean[]>([false]);
    const [pendingDeleteSubjectIndex, setPendingDeleteSubjectIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [education, setEducation] = useState<EducationEntry[]>([]);
    const [experience, setExperience] = useState("");
    const [certificates, setCertificates] = useState<CertificateEntry[]>([]);
    const [certUploading, setCertUploading] = useState(false);
    const certInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

    useEffect(() => {
        setAvatarSrc(resolveApiAssetUrl(settings?.avatarUrl) || user?.avatar || null);
    }, [settings?.avatarUrl, user?.avatar]);

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
        setOfflineAddress(settings?.offlineAddress || "");
        setFormat(settings?.format || "online");
        setExperience(settings?.experience || "");
        const eduData = settings?.education as EducationEntry[] | null;
        if (eduData && Array.isArray(eduData) && eduData.length > 0) {
            setEducation(
                eduData.map((entry) => ({
                    id: typeof entry?.id === "string" && entry.id.trim().length > 0
                        ? entry.id
                        : createDraftEducationId(),
                    institution: entry?.institution || "",
                    program: entry?.program || "",
                    years: entry?.years || "",
                }))
            );
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
            const normalizedDetails = details
                .filter((entry) => entry && typeof entry.name === "string")
                .map((entry) => ({
                    name: entry.name || "",
                    price: entry.price || "",
                    duration: entry.duration || "60",
                }));
            setSubjects(normalizedDetails);
            setSavedSubjectFlags(normalizedDetails.map(() => true));
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
        settings?.vk, settings?.website,
        settings?.format, settings?.offlineAddress, settings?.subjectDetails, settings?.subjects,
        user?.id, user?.name, user?.email, user?.phone, user?.whatsapp]);

    useEffect(() => {
        if (subjects.length === 0) {
            setPendingDeleteSubjectIndex(null);
            return;
        }

        setPendingDeleteSubjectIndex((prev) => {
            if (prev === null) {
                return null;
            }
            return prev > subjects.length - 1 ? null : prev;
        });
    }, [subjects.length]);

    const addSubject = () => {
        const next = [...subjects, { name: "", price: "", duration: "60" }];
        setSubjects(next);
        setSavedSubjectFlags((prev) => [...prev, false]);
        setPendingDeleteSubjectIndex(null);
    };

    const removeSubject = (i: number) => {
        const next = subjects.filter((_, idx) => idx !== i);
        setSubjects(next);
        setSavedSubjectFlags((prev) => prev.filter((_, idx) => idx !== i));
        if (next.length === 0) {
            setPendingDeleteSubjectIndex(null);
            return;
        }

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
        const updated = [...subjects];
        updated[i] = { ...updated[i], [field]: v };
        setSubjects(updated);
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (readEvent) => setAvatarSrc(readEvent.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const result = await uploadAvatar(file);
            setAvatarSrc(resolveApiAssetUrl(result.avatarUrl) || null);
            await Promise.all([mutateSettings(), refreshUser()]);
        } catch (error: any) {
            setSaveMsg(codedErrorMessage("SETT-ACC-AVATAR", error));
        } finally {
            if (avatarInputRef.current) {
                avatarInputRef.current.value = "";
            }
        }
    };

    const handleCertUpload = async (file: File) => {
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
    };

    const handleCertDelete = async (id: string) => {
        try {
            await deleteCertificate(id);
            setCertificates((prev) => prev.filter((c) => c.id !== id));
            await mutateSettings();
        } catch {
            setSaveMsg("Ошибка удаления");
        }
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        setSaveMsg(null);
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
                vk: vk.trim(), website: website.trim(),
                format, offlineAddress: offlineAddress.trim(),
                education: education.filter((e) => e.institution.trim()),
                experience: experience.trim(),
            });
            await Promise.all([mutateSettings(), refreshUser()]);
            setSavedSubjectFlags(subjects.map((s) => Boolean(s.name.trim())));
            setSaveMsg("Сохранено");
        } catch (e: any) {
            setSaveMsg(codedErrorMessage("SETT-ACC-SAVE", e));
        } finally {
            setSaving(false);
        }
    };

    const qualificationVerified = !!settings?.qualificationVerified;

    return (
        <div className="repeto-settings-account-stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PersonalDataSection
                name={name} setName={setName}
                email={email}
                phone={phone} setPhone={setPhone}
                whatsapp={whatsapp} setWhatsapp={setWhatsapp}
                vk={vk} setVk={setVk}
                website={website} setWebsite={setWebsite}
                about={about} setAbout={setAbout}
            />

            <PortraitSection
                avatarSrc={avatarSrc}
                userName={user?.name}
                avatarInputRef={avatarInputRef}
                onAvatarChange={handleAvatarChange}
            />

            <PaymentSection
                paymentCardNumber={paymentCardNumber} setPaymentCardNumber={setPaymentCardNumber}
                paymentSbpPhone={paymentSbpPhone} setPaymentSbpPhone={setPaymentSbpPhone}
                paymentRequisites={paymentRequisites} setPaymentRequisites={setPaymentRequisites}
            />

            <SubjectsSection
                subjects={subjects}
                savedSubjectFlags={savedSubjectFlags}
                pendingDeleteSubjectIndex={pendingDeleteSubjectIndex}
                saving={saving}
                onAdd={addSubject}
                onRemove={removeSubject}
                onUpdate={updateSubject}
                onRequestDelete={(i) => setPendingDeleteSubjectIndex(i)}
                onCancelDelete={() => setPendingDeleteSubjectIndex(null)}
            />

            <FormatSection
                format={format} setFormat={setFormat}
                offlineAddress={offlineAddress} setOfflineAddress={setOfflineAddress}
            />

            <EducationSection education={education} setEducation={setEducation} />

            <QualificationSection
                experience={experience} setExperience={setExperience}
                qualificationVerified={qualificationVerified}
            />

            <CertificatesSection
                certificates={certificates}
                certUploading={certUploading}
                certInputRef={certInputRef}
                onUploadFile={handleCertUpload}
                onDelete={handleCertDelete}
            />

            <SaveBar saving={saving} saveMsg={saveMsg} onSave={handleSave} />
        </div>
    );
};

export default Account;
