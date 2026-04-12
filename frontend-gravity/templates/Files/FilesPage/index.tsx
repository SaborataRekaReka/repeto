import { useState } from "react";
import GravityLayout from "@/components/GravityLayout";
import { SegmentedRadioGroup, Card } from "@gravity-ui/uikit";
import { useFilesOverview } from "@/hooks/useFiles";
import ConnectCloud from "./ConnectCloud";
import FileBrowser from "./FileBrowser";
import StudentAccessTab from "./StudentAccessTab";

const tabOptions = [
    { value: "files", content: "Файлы" },
    { value: "access", content: "Доступ учеников" },
];

const FilesPage = () => {
    const [tab, setTab] = useState("files");
    const { data, loading, refetch } = useFilesOverview();
    const connected = (data?.cloudConnections || []).some((c) => c.connected);

    if (!data && loading) {
        return (
            <GravityLayout title="Материалы">
                <div style={{ marginBottom: 20 }}>
                    <SegmentedRadioGroup size="m" value={tab} onUpdate={setTab} options={tabOptions} />
                </div>
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
            </GravityLayout>
        );
    }

    if (!connected) {
        return (
            <GravityLayout title="Материалы">
                <ConnectCloud />
            </GravityLayout>
        );
    }

    return (
        <GravityLayout title="Материалы">
            <div style={{ marginBottom: 20 }}>
                <SegmentedRadioGroup size="m" value={tab} onUpdate={setTab} options={tabOptions} />
            </div>
            {tab === "files" && (
                <FileBrowser
                    files={data?.files || []}
                    cloudConnections={data?.cloudConnections || []}
                    onUpdated={refetch}
                />
            )}
            {tab === "access" && (
                <StudentAccessTab
                    files={data?.files || []}
                    studentAccess={data?.studentAccess || []}
                    onUpdated={refetch}
                />
            )}
        </GravityLayout>
    );
};

export default FilesPage;
