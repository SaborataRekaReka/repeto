import { useState } from "react";
import Layout from "@/components/Layout";
import Tabs from "@/components/Tabs";
import { useFilesOverview } from "@/hooks/useFiles";
import ConnectCloud from "./ConnectCloud";
import FileBrowser from "./FileBrowser";
import StudentAccessTab from "./StudentAccessTab";

const tabs = [
    { title: "Файлы", value: "files" },
    { title: "Доступ учеников", value: "access" },
];

const FilesPage = () => {
    const [tab, setTab] = useState("files");
    const { data, loading, refetch } = useFilesOverview();
    const connected = (data?.cloudConnections || []).some((c) => c.connected);

    if (!data && loading) {
        return (
            <Layout title="Материалы">
                <div className="flex items-center justify-between mb-6">
                    <Tabs items={tabs} value={tab} setValue={setTab} />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="card px-5 py-4 animate-pulse"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-sm bg-n-3/20 dark:bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-n-3/20 dark:bg-white/10" />
                                    <div className="h-2 w-1/5 rounded bg-n-3/10 dark:bg-white/5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Layout>
        );
    }

    if (!connected) {
        return (
            <Layout title="Материалы">
                <ConnectCloud />
            </Layout>
        );
    }

    return (
        <Layout title="Материалы">
            <div className="flex items-center justify-between mb-6">
                <Tabs items={tabs} value={tab} setValue={setTab} />
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
                />
            )}
        </Layout>
    );
};

export default FilesPage;
