import { useState } from "react";
import { Card } from "@gravity-ui/uikit";
import GravityLayout from "@/components/GravityLayout";
import PageOverlay from "@/components/PageOverlay";
import { useFilesOverview } from "@/hooks/useFiles";
import ConnectCloud from "./ConnectCloud";
import FileBrowser from "./FileBrowser";
import StudentAccessTab from "./StudentAccessTab";

const FilesPage = () => {
    const [tab, setTab] = useState<string>("files");
    const { data, loading, refetch } = useFilesOverview();
    const connected = (data?.cloudConnections || []).some((c) => c.connected);

    const overlayNav = [
        { key: "files", label: "Файлы" },
        { key: "access", label: "Доступы учеников" },
    ];

    const handleOverlayNav = (key: string) => {
        setTab(key === "access" ? "access" : "files");
    };

    const renderContent = () => {
        if (!data && loading) {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} view="outlined" style={{ padding: "16px 20px", background: "var(--g-color-base-float)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--g-color-base-generic)" }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: 12, width: "33%", borderRadius: 4, background: "var(--g-color-base-generic)", marginBottom: 8 }} />
                                    <div style={{ height: 8, width: "20%", borderRadius: 4, background: "var(--g-color-base-generic)" }} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            );
        }

        if (!connected) {
            return <ConnectCloud />;
        }

        if (tab === "access") {
            return (
                <StudentAccessTab
                    files={data?.files || []}
                    studentAccess={data?.studentAccess || []}
                    onUpdated={refetch}
                />
            );
        }

        return (
            <FileBrowser
                files={data?.files || []}
                cloudConnections={data?.cloudConnections || []}
                onUpdated={refetch}
            />
        );
    };

    return (
        <GravityLayout title="Материалы">
            <PageOverlay
                className="page-overlay--finance-dashboard-bg"
                title="Материалы"
                backHref="/dashboard"
                nav={overlayNav}
                activeNav={tab === "access" ? "access" : "files"}
                onNavChange={handleOverlayNav}
            >
                {renderContent()}
            </PageOverlay>
        </GravityLayout>
    );
};

export default FilesPage;
