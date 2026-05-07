import { useCallback, useEffect, useState } from "react";
import { Button, Icon, Text } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { Gear, Person } from "@gravity-ui/icons";
import AppDialog from "@/components/AppDialog";
import StudentAvatar from "@/components/StudentAvatar";
import StudentSignIn from "@/templates/RegistrationPage/StudentSignIn";
import StudentSettingsDialog from "./StudentSettingsDialog";
import { resolveApiAssetUrl } from "@/lib/api";
import { getStudentAccessToken, studentApi, studentLogout } from "@/lib/studentAuth";

type StudentSetupResponse = {
    name?: string | null;
    avatarUrl?: string | null;
};

type StudentProfileInfo = {
    name: string;
    avatarUrl: string | null;
};

/**
 * Right-side content for the public shell header (PublicPageHeader).
 * Shows student avatar + name + settings link when the visitor has a
 * student portal session, or a sign-in icon otherwise.
 * Shared by TutorPublicPage and BookingPage so the shell looks identical.
 */
const StudentHeaderRight = () => {
    const [profile, setProfile] = useState<StudentProfileInfo | null>(null);
    const [signInOpen, setSignInOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const triggerReload = useCallback(() => {
        setReloadKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        let canceled = false;

        const load = async () => {
            if (!getStudentAccessToken()) {
                if (!canceled) setProfile(null);
                return;
            }
            try {
                const setup = await studentApi<StudentSetupResponse>("/student-portal/setup");
                if (canceled) return;
                const rawName = String(setup?.name || "").trim();
                const rawAvatar = setup?.avatarUrl
                    ? resolveApiAssetUrl(setup.avatarUrl) || null
                    : null;
                setProfile({
                    name: rawName || "Ученик",
                    avatarUrl: rawAvatar,
                });
            } catch {
                if (!canceled) setProfile(null);
            }
        };

        void load();
        return () => {
            canceled = true;
        };
    }, [reloadKey]);

    useEffect(() => {
        const handleAuthChanged = () => {
            triggerReload();
        };

        const handleVisibilityChange = () => {
            if (typeof document !== "undefined" && document.visibilityState === "visible") {
                triggerReload();
            }
        };

        window.addEventListener("repeto:student-auth-changed", handleAuthChanged as EventListener);
        window.addEventListener("focus", handleAuthChanged);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("repeto:student-auth-changed", handleAuthChanged as EventListener);
            window.removeEventListener("focus", handleAuthChanged);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [triggerReload]);

    if (profile) {
        return (
            <>
                <StudentAvatar
                    student={{ name: profile.name, avatarUrl: profile.avatarUrl || undefined }}
                    size="s"
                />
                <Text variant="body-1" style={{ fontWeight: 500 }}>
                    {profile.name}
                </Text>
                <Button
                    view="flat"
                    size="s"
                    onClick={() => setSettingsOpen(true)}
                    aria-label="Настройки профиля ученика"
                >
                    <Icon data={Gear as IconData} size={16} />
                </Button>
                <StudentSettingsDialog
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    fallbackProfile={profile}
                    onSaved={() => triggerReload()}
                    onLogout={async () => {
                        await studentLogout();
                        setSettingsOpen(false);
                        setProfile(null);
                    }}
                />
            </>
        );
    }

    return (
        <>
            <Button
                view="flat"
                size="s"
                onClick={() => setSignInOpen(true)}
                aria-label="Вход ученика"
            >
                <Icon data={Person as IconData} size={16} />
            </Button>
            <AppDialog
                open={signInOpen}
                onClose={() => setSignInOpen(false)}
                size="s"
                caption={undefined}
                footer={undefined}
            >
                <StudentSignIn
                    onBack={() => setSignInOpen(false)}
                    onSignedIn={async () => {
                        setSignInOpen(false);
                        triggerReload();
                    }}
                />
            </AppDialog>
        </>
    );
};

export default StudentHeaderRight;
