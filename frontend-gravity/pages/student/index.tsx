import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button, Text, Loader } from "@gravity-ui/uikit";
import {
    studentApi,
    studentLogout,
    getStudentAccessToken,
} from "@/lib/studentAuth";
import type { StudentPortalData } from "@/types/student-portal";
import StudentPortalPage from "@/templates/Public/StudentPortalPage";
import { codedErrorMessage } from "@/lib/errorCodes";

type TutorLink = {
    studentId: string;
    tutorId: string;
    tutorName: string;
    tutorSlug: string;
    tutorAvatarUrl?: string | null;
    subject: string;
    status: string;
};

const StudentPortalRoutePage = () => {
    const router = useRouter();
    const [loadingTutors, setLoadingTutors] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [tutors, setTutors] = useState<TutorLink[]>([]);
    const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
    const [data, setData] = useState<StudentPortalData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!getStudentAccessToken()) {
            router.replace("/auth?view=student");
            return;
        }
        (async () => {
            try {
                const list = await studentApi<TutorLink[]>(`/student-portal/tutors`);
                setTutors(list);
                if (list.length > 0) {
                    setActiveStudentId(list[0].studentId);
                } else {
                    setData(null);
                }
            } catch (err: any) {
                if (err?.statusCode === 401) {
                    router.replace("/auth?view=student");
                    return;
                }
                setError(codedErrorMessage("STUDENT-PORTAL-TUTORS", err));
            } finally {
                setLoadingTutors(false);
            }
        })();
    }, [router]);

    useEffect(() => {
        if (!activeStudentId) {
            setData(null);
            return;
        }

        (async () => {
            setLoadingData(true);
            try {
                const res = await studentApi<StudentPortalData>(
                    `/student-portal/students/${activeStudentId}/data`,
                );
                setData(res);
            } catch (err: any) {
                if (err?.statusCode === 401) {
                    router.replace("/auth?view=student");
                    return;
                }
                setError(codedErrorMessage("STUDENT-PORTAL-DATA", err));
            } finally {
                setLoadingData(false);
            }
        })();
    }, [activeStudentId, router]);

    const handleLogout = async () => {
        await studentLogout();
        router.replace("/auth?view=student");
    };

    if (loadingTutors || (activeStudentId && loadingData && !data)) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 48 }}>
                <Loader size="l" />
            </div>
        );
    }

    if (!getStudentAccessToken()) {
        return null;
    }

    if (tutors.length === 0) {
        return (
            <>
                <Head>
                    <title>Мой кабинет — Repeto</title>
                </Head>
                <div
                    style={{
                        minHeight: "100vh",
                        background: "var(--repeto-bg)",
                        padding: "24px 16px",
                    }}
                >
                    <div style={{ maxWidth: 720, margin: "0 auto" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 20,
                            }}
                        >
                            <Text variant="header-1">Мой кабинет</Text>
                            <Button view="flat" onClick={handleLogout}>
                                Выйти
                            </Button>
                        </div>

                        {error && (
                            <Text variant="body-2" color="danger" style={{ marginBottom: 12 }}>
                                {error}
                            </Text>
                        )}

                        <div
                            style={{
                                background: "var(--g-color-base-float)",
                                borderRadius: 16,
                                padding: 24,
                            }}
                        >
                            <Text variant="body-1">
                                У вас пока нет репетиторов. Когда вы оставите заявку
                                на странице репетитора и подтвердите почту, репетитор
                                появится здесь.
                            </Text>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!activeStudentId || !data) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Text variant="body-1" color="secondary">Не удалось загрузить кабинет ученика</Text>
            </div>
        );
    }

    return (
        <StudentPortalPage
            key={activeStudentId}
            data={data}
            studentId={activeStudentId}
            tutors={tutors}
            activeStudentId={activeStudentId}
            onSelectStudent={setActiveStudentId}
            onLogout={handleLogout}
            error={error}
        />
    );
};

export default StudentPortalRoutePage;
