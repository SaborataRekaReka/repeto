import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    TextInput,
    Text,
    Button,
    Loader,
} from "@gravity-ui/uikit";
import {
    studentApi,
    getStudentAccessToken,
} from "@/lib/studentAuth";
import { codedErrorMessage } from "@/lib/errorCodes";
import { Lp2Field, Lp2Row } from "@/components/Lp2Field";
import Lp2PlannerShell, { Lp2PlannerLayout, Lp2PlannerSection } from "@/components/Lp2PlannerShell";
import PhoneInput from "@/components/PhoneInput";

type SetupData = {
    name: string;
    email: string;
    phone: string;
    age: number | null;
    grade: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
};

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 30;
const GRADE_MAX_LENGTH = 50;
const PARENT_NAME_MAX_LENGTH = 100;

function cleanOptionalString(value: string): string | undefined {
    const trimmed = String(value || "").trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function isEmailLike(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const StudentSetupPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [age, setAge] = useState("");
    const [grade, setGrade] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [touched, setTouched] = useState({ name: false });

    const markTouched = (field: "name") => {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };

    useEffect(() => {
        if (!getStudentAccessToken()) {
            router.replace("/auth?view=student");
            return;
        }

        (async () => {
            try {
                const data = await studentApi<SetupData>("/student-portal/setup");
                setName(data.name || "");
                setEmail(data.email || "");
                setPhone(data.phone || "");
                setAge(data.age ? String(data.age) : "");
                setGrade(data.grade || "");
                setParentName(data.parentName || "");
                setParentPhone(data.parentPhone || "");
                setParentEmail(data.parentEmail || "");
            } catch (err: any) {
                if (err?.statusCode === 401) {
                    router.replace("/auth?view=student");
                    return;
                }
                setFormError(codedErrorMessage("STUDENT-SETUP-LOAD", err));
            } finally {
                setLoading(false);
            }
        })();
    }, [router]);

    const handleSubmit = useCallback(async () => {
        const normalizedName = name.trim();
        const normalizedAge = Number(String(age || "").trim());
        const safeAge = Number.isFinite(normalizedAge) && normalizedAge > 0
            ? Math.floor(normalizedAge)
            : undefined;
        const safePhone = cleanOptionalString(phone);
        const safeGrade = cleanOptionalString(grade);
        const safeParentName = cleanOptionalString(parentName);
        const safeParentPhone = cleanOptionalString(parentPhone);
        const safeParentEmail = cleanOptionalString(parentEmail);

        setTouched({ name: true });

        if (
            !normalizedName ||
            normalizedName.length < NAME_MIN_LENGTH ||
            normalizedName.length > NAME_MAX_LENGTH
        ) {
            setFormError("ФИО должно содержать от 2 до 100 символов.");
            return;
        }

        if (safePhone && safePhone.length > PHONE_MAX_LENGTH) {
            setFormError("Телефон слишком длинный.");
            return;
        }

        if (safeGrade && safeGrade.length > GRADE_MAX_LENGTH) {
            setFormError("Поле «Класс» слишком длинное.");
            return;
        }

        if (safeParentName && safeParentName.length > PARENT_NAME_MAX_LENGTH) {
            setFormError("ФИО родителя слишком длинное.");
            return;
        }

        if (safeParentPhone && safeParentPhone.length > PHONE_MAX_LENGTH) {
            setFormError("Телефон родителя слишком длинный.");
            return;
        }

        if (safeParentEmail && !isEmailLike(safeParentEmail)) {
            setFormError("Укажите корректный email родителя.");
            return;
        }

        setSaving(true);
        setFormError(null);
        try {
            await studentApi("/student-portal/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: normalizedName,
                    phone: safePhone || null,
                    age: safeAge || null,
                    grade: safeGrade || null,
                    parentName: safeParentName || null,
                    parentPhone: safeParentPhone || null,
                    parentEmail: safeParentEmail || null,
                }),
            });
            router.replace("/student");
        } catch (err: any) {
            setFormError(codedErrorMessage("STUDENT-SETUP-SAVE", err));
        } finally {
            setSaving(false);
        }
    }, [
        name,
        phone,
        age,
        grade,
        parentName,
        parentPhone,
        parentEmail,
        router,
    ]);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 48,
                }}
            >
                <Loader size="l" />
            </div>
        );
    }

    const nameError = touched.name && !name.trim();

    return (
        <>
            <Head>
                <title>Заполните профиль — Repeto</title>
            </Head>
            <Lp2PlannerShell
                className="lp2--student-setup"
                style={{ zIndex: 960 }}
                isOpen
                ariaLabel="Заполнение профиля"
                title="Добро пожаловать в Repeto"
                subtitle="Проверьте и дополните свои данные"
                footer={(
                    <Button
                        className="lp2__submit"
                        view="action"
                        size="xl"
                        width="max"
                        onClick={handleSubmit}
                        loading={saving}
                    >
                        Завершить и войти
                    </Button>
                )}
            >
                <Lp2PlannerLayout>
                    <Lp2PlannerSection title="Основное">
                        <Lp2Field label="ФИО *" error={nameError} errorText="Обязательное поле">
                            <TextInput
                                value={name}
                                onUpdate={setName}
                                onBlur={() => markTouched("name")}
                                placeholder="Иванов Пётр Сергеевич"
                                size="l"
                            />
                        </Lp2Field>

                        <Lp2Field label="Email">
                            <TextInput
                                value={email}
                                size="l"
                                disabled
                            />
                        </Lp2Field>

                        <Lp2Field label="Телефон">
                            <PhoneInput
                                value={phone}
                                onUpdate={setPhone}
                            />
                        </Lp2Field>

                        <Lp2Row>
                            <Lp2Field label="Класс" half>
                                <TextInput
                                    value={grade}
                                    onUpdate={setGrade}
                                    placeholder="11"
                                    size="l"
                                />
                            </Lp2Field>
                            <Lp2Field label="Возраст" half>
                                <TextInput
                                    value={age}
                                    onUpdate={setAge}
                                    placeholder="15"
                                    size="l"
                                    type="number"
                                />
                            </Lp2Field>
                        </Lp2Row>
                    </Lp2PlannerSection>

                    <Lp2PlannerSection title="Контакт родителя">
                        <Lp2Field label="ФИО родителя">
                            <TextInput
                                value={parentName}
                                onUpdate={setParentName}
                                placeholder="Иванова Мария Петровна"
                                size="l"
                            />
                        </Lp2Field>

                        <Lp2Row>
                            <Lp2Field label="Телефон родителя" half>
                                <PhoneInput
                                    value={parentPhone}
                                    onUpdate={setParentPhone}
                                />
                            </Lp2Field>
                            <Lp2Field label="Email родителя" half>
                                <TextInput
                                    value={parentEmail}
                                    onUpdate={setParentEmail}
                                    placeholder="parent@email.com"
                                    size="l"
                                    type="email"
                                />
                            </Lp2Field>
                        </Lp2Row>
                    </Lp2PlannerSection>

                    {formError && (
                        <Lp2PlannerSection>
                            <Text
                                as="div"
                                variant="body-1"
                                style={{ color: "var(--g-color-text-danger)" }}
                            >
                                {formError}
                            </Text>
                        </Lp2PlannerSection>
                    )}
                </Lp2PlannerLayout>
            </Lp2PlannerShell>
        </>
    );
};

export default StudentSetupPage;
