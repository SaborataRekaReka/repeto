import Link from "next/link";
import { Button, Icon, Text } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { ArrowRightFromSquare, Gear } from "@gravity-ui/icons";
import StudentAvatar from "@/components/StudentAvatar";

type StudentHeaderProfile = {
    name: string;
    avatarUrl?: string | null;
};

type StudentHeaderAccountControlsProps = {
    profile: StudentHeaderProfile;
    dashboardHref?: string;
    onOpenSettings?: () => void;
    onLogout?: () => void | Promise<void>;
    settingsAriaLabel?: string;
    logoutAriaLabel?: string;
    dashboardAriaLabel?: string;
};

const StudentHeaderAccountControls = ({
    profile,
    dashboardHref = "/student",
    onOpenSettings,
    onLogout,
    settingsAriaLabel = "Open student settings",
    logoutAriaLabel = "Log out student account",
    dashboardAriaLabel = "Open student dashboard",
}: StudentHeaderAccountControlsProps) => {
    const safeName = profile.name.trim() || "Student";

    return (
        <>
            <Link
                href={dashboardHref}
                className="repeto-portal-header__student-link"
                aria-label={dashboardAriaLabel}
            >
                <StudentAvatar
                    student={{ name: safeName, avatarUrl: profile.avatarUrl || undefined }}
                    size="s"
                />
                <Text variant="body-1" className="repeto-portal-header__student-name">
                    {safeName}
                </Text>
            </Link>

            {onOpenSettings ? (
                <Button
                    view="flat"
                    size="s"
                    onClick={onOpenSettings}
                    aria-label={settingsAriaLabel}
                >
                    <Icon data={Gear as IconData} size={16} />
                </Button>
            ) : null}

            {onLogout ? (
                <Button
                    view="flat"
                    size="s"
                    onClick={() => {
                        void Promise.resolve(onLogout());
                    }}
                    aria-label={logoutAriaLabel}
                >
                    <Icon data={ArrowRightFromSquare as IconData} size={16} />
                </Button>
            ) : null}
        </>
    );
};

export default StudentHeaderAccountControls;
