import Link from "next/link";
import { Card, Text, Button, Icon } from "@gravity-ui/uikit";
import { CloudArrowUpIn, Gear, FolderOpen } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

const ConnectCloud = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <div style={{
                    width: 80, height: 80, borderRadius: 16,
                    background: "rgba(174,122,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Icon data={CloudArrowUpIn as IconData} size={32} />
                </div>
            </div>
            <Text variant="header-1" style={{ display: "block", marginBottom: 8 }}>
                Подключите облачное хранилище
            </Text>
            <Text variant="body-1" color="secondary" style={{ display: "block", maxWidth: 380, margin: "0 auto 32px" }}>
                Материалы для учеников хранятся на Яндекс.Диске или Google Drive.
                Подключите хранилище, чтобы управлять файлами и делиться ими с учениками.
            </Text>
            <Link href="/settings?tab=integrations" style={{ textDecoration: "none" }}>
                <Button view="action" size="l">
                    <Icon data={Gear as IconData} size={16} />
                    Подключить в Настройках
                </Button>
            </Link>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 380, margin: "40px auto 0" }}>
                <Card view="outlined" style={{ padding: 20, textAlign: "left", background: "var(--g-color-base-float)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--g-color-base-generic)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                        <Icon data={FolderOpen as IconData} size={18} />
                    </div>
                    <Text variant="body-1" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Яндекс.Диск</Text>
                    <Text variant="caption-2" color="secondary">Подключите папку или корень диска через API</Text>
                </Card>
                <Card view="outlined" style={{ padding: 20, textAlign: "left", background: "var(--g-color-base-float)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--g-color-base-generic)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                        <Icon data={FolderOpen as IconData} size={18} />
                    </div>
                    <Text variant="body-1" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Google Drive</Text>
                    <Text variant="caption-2" color="secondary">Подключите папку или корень диска через API</Text>
                </Card>
            </div>
        </div>
    </div>
);

export default ConnectCloud;
