import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Card, Text, Button, Label, TextInput } from "@gravity-ui/uikit";
import { Calendar, FolderOpen } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import {
    useSettings, disconnectIntegration,
    updateAccount,
    startYandexDiskConnect, completeYandexDiskConnect, connectYandexDiskToken,
    startGoogleCalendarConnect, completeGoogleCalendarConnect,
    startGoogleDriveConnect, completeGoogleDriveConnect,
    startYandexCalendarConnect, connectYandexCalendarToken,
} from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";
import AppSelect from "@/components/AppSelect";
import AppField from "@/components/AppField";

type IntegrationDef = {
    id: string;
    name: string;
    description: string;
    icon: unknown;
    iconBg: string;
    animatedIconPath: string;
};
type HomeworkDefaultCloud = "YANDEX_DISK" | "GOOGLE_DRIVE";

const homeworkDefaultCloudOptions = [
    { value: "YANDEX_DISK", content: "Яндекс.Диск" },
    { value: "GOOGLE_DRIVE", content: "Google Drive" },
];

const Integrations = () => {
    const router = useRouter();
    const { data: settings, mutate } = useSettings();
    const [yandexToken, setYandexToken] = useState("");
    const [yandexOAuthAvailable, setYandexOAuthAvailable] = useState<boolean | null>(null);
    const [yandexCalToken, setYandexCalToken] = useState("");
    const [yandexCalOAuthAvailable, setYandexCalOAuthAvailable] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);
    const [savingDefaultCloud, setSavingDefaultCloud] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [homeworkDefaultCloud, setHomeworkDefaultCloud] = useState<HomeworkDefaultCloud>("YANDEX_DISK");
    const handledOAuthRef = useRef(false);

    const hasYandexDisk = !!settings?.hasYandexDisk;
    const hasGoogleDrive = !!settings?.hasGoogleDrive;
    const hasGoogleCalendar = !!settings?.hasGoogleCalendar;
    const hasYandexCalendar = !!settings?.hasYandexCalendar;

    useEffect(() => {
        const value = settings?.homeworkDefaultCloud;
        if (value === "GOOGLE_DRIVE" || value === "YANDEX_DISK") {
            setHomeworkDefaultCloud(value);
        }
    }, [settings?.homeworkDefaultCloud]);

    // --- OAuth callback handling (identical logic) ---
    useEffect(() => {
        if (!router.isReady || handledOAuthRef.current) return;
        if (typeof window !== "undefined" && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
            const accessToken = hashParams.get("access_token");
            if (accessToken) {
                handledOAuthRef.current = true;
                let pending = "yandex-disk";
                try {
                    pending = sessionStorage.getItem("pending_yandex_integration") || "yandex-disk";
                    sessionStorage.removeItem("pending_yandex_integration");
                } catch {}
                if (pending === "yandex-calendar") {
                    (async () => {
                        setSaving(true); setMsg(null);
                        try { const r = await connectYandexCalendarToken({ token: accessToken }); await mutate(); setMsg(`Яндекс.Календарь подключен (${r.email || "аккаунт"})`); }
                        catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YCAL-CB", e)); }
                        finally { setSaving(false); window.history.replaceState(null, "", "/settings?tab=integrations"); }
                    })();
                    return;
                }
                (async () => {
                    setSaving(true); setMsg(null);
                    try { const r = await connectYandexDiskToken({ token: accessToken }); await mutate(); setMsg(`Яндекс.Диск подключен (${r.email || "аккаунт"}). Синхронизировано: ${r.syncedItems}`); }
                    catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YDISK-CB", e)); }
                    finally { setSaving(false); window.history.replaceState(null, "", "/settings?tab=integrations"); }
                })();
                return;
            }
        }
        const code = router.query.code; const state = router.query.state; const integration = router.query.integration;
        if (integration === "google-calendar" && typeof code === "string") {
            handledOAuthRef.current = true;
            (async () => {
                setSaving(true); setMsg(null);
                try { const r = await completeGoogleCalendarConnect({ code }); await mutate(); setMsg(`Google Calendar подключен (${r.email || "аккаунт"})`); }
                catch (e: any) { setMsg(codedErrorMessage("SETT-INT-GCAL-CB", e)); }
                finally { setSaving(false); router.replace({ pathname: "/settings", query: { tab: "integrations" } }, undefined, { shallow: true }); }
            })();
            return;
        }
        if (integration === "google-drive" && typeof code === "string") {
            handledOAuthRef.current = true;
            (async () => {
                setSaving(true); setMsg(null);
                try {
                    const r = await completeGoogleDriveConnect({ code });
                    await mutate();
                    const syncedInfo = typeof r.syncedItems === "number"
                        ? `. Синхронизировано: ${r.syncedItems}`
                        : "";
                    setMsg(`Google Drive подключен (${r.email || "аккаунт"})${syncedInfo}`);
                }
                catch (e: any) {
                    const code = codedErrorMessage("SETT-INT-GDRV-CB", e);
                    const details = typeof e?.message === "string" && e.message.trim()
                        ? `${e.message}. ${code}`
                        : code;
                    setMsg(details);
                }
                finally { setSaving(false); router.replace({ pathname: "/settings", query: { tab: "integrations" } }, undefined, { shallow: true }); }
            })();
            return;
        }
        if (integration !== "yandex-disk" || typeof code !== "string" || typeof state !== "string") return;
        handledOAuthRef.current = true;
        (async () => {
            setSaving(true); setMsg(null);
            try { const r = await completeYandexDiskConnect({ code, state }); await mutate(); setMsg(`Яндекс.Диск подключен: ${r.rootPath}. Синхронизировано: ${r.syncedItems}`); }
            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YDISK-OAUTH", e)); }
            finally { setSaving(false); router.replace({ pathname: "/settings", query: { tab: "integrations" } }, undefined, { shallow: true }); }
        })();
    }, [router, mutate]);

    const defs: IntegrationDef[] = [
        {
            id: "google-calendar",
            name: "Google Calendar",
            description: "Двусторонняя синхронизация расписания",
            icon: Calendar,
            iconBg: "rgba(66,133,244,0.1)",
            animatedIconPath: "/icons/sidebar-animated/calendar.json",
        },
        {
            id: "google-drive",
            name: "Google Drive",
            description: "Хранение и доступ к файлам учеников",
            icon: FolderOpen,
            iconBg: "rgba(66,133,244,0.1)",
            animatedIconPath: "/icons/sidebar-animated/folder-open.json",
        },
        {
            id: "yandex-calendar",
            name: "Яндекс.Календарь",
            description: "Двусторонняя синхронизация расписания",
            icon: Calendar,
            iconBg: "rgba(252,63,29,0.1)",
            animatedIconPath: "/icons/sidebar-animated/calendar.json",
        },
        {
            id: "yandex-disk",
            name: "Яндекс.Диск",
            description: "Хранение и доступ к файлам учеников",
            icon: FolderOpen,
            iconBg: "rgba(252,63,29,0.1)",
            animatedIconPath: "/icons/sidebar-animated/folder-open.json",
        },
    ];

    const getStatus = (id: string) => {
        if (id === "google-calendar") return hasGoogleCalendar ? "connected" : "disconnected";
        if (id === "google-drive") return hasGoogleDrive ? "connected" : "disconnected";
        if (id === "yandex-calendar") return hasYandexCalendar ? "connected" : "disconnected";
        if (id === "yandex-disk") return hasYandexDisk ? "connected" : "disconnected";
        return "disconnected";
    };

    const handleConnect = async (id: string) => {
        if (id === "google-calendar") {
            setSaving(true); setMsg(null);
            try {
                const r = await startGoogleCalendarConnect();
                if (r.oauthConfigured && "authUrl" in r) { window.location.href = r.authUrl; return; }
                setMsg(codedErrorMessage("SETT-INT-GCAL-OAUTH"));
            }
            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-GCAL-CONN", e)); }
            finally { setSaving(false); }
            return;
        }
        if (id === "google-drive") {
            setSaving(true); setMsg(null);
            try {
                const r = await startGoogleDriveConnect();
                if (r.oauthConfigured && "authUrl" in r) { window.location.href = r.authUrl; return; }
                setMsg(codedErrorMessage("SETT-INT-GDRV-OAUTH"));
            }
            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-GDRV-CONN", e)); }
            finally { setSaving(false); }
            return;
        }
        if (id === "yandex-calendar") {
            setSaving(true); setMsg(null);
            try {
                const r = await startYandexCalendarConnect();
                if (r.oauthConfigured && "authUrl" in r) { try { sessionStorage.setItem("pending_yandex_integration", "yandex-calendar"); } catch {} window.location.href = r.authUrl; return; }
                setYandexCalOAuthAvailable(false);
                setMsg(codedErrorMessage("SETT-INT-YCAL-OAUTH"));
            }
            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YCAL-CONN", e)); }
            finally { setSaving(false); }
            return;
        }
        if (id === "yandex-disk") {
            setSaving(true); setMsg(null);
            try {
                const r = await startYandexDiskConnect();
                if (r.oauthConfigured && "authUrl" in r) { window.location.href = r.authUrl; return; }
                setYandexOAuthAvailable(false);
                setMsg(codedErrorMessage("SETT-INT-YDISK-OAUTH"));
            }
            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YDISK-CONN", e)); }
            finally { setSaving(false); }
        }
    };

    const handleDisconnect = async (id: string) => {
        setSaving(true);
        try { await disconnectIntegration(id); await mutate(); }
        catch (e: any) { setMsg(codedErrorMessage("SETT-INT-DISCONN", e)); }
        finally { setSaving(false); }
    };

    const handleYandexCalTokenConnect = async () => {
        if (!yandexCalToken.trim()) { setMsg("Вставьте OAuth-токен"); return; }
        setSaving(true); setMsg(null);
        try { const r = await connectYandexCalendarToken({ token: yandexCalToken.trim() }); await mutate(); setMsg(`Яндекс.Календарь подключен (${r.email || "аккаунт"})`); setYandexCalToken(""); setYandexCalOAuthAvailable(null); }
        catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YCAL-TOKEN", e)); }
        finally { setSaving(false); }
    };

    const handleYandexTokenConnect = async () => {
        if (!yandexToken.trim()) { setMsg("Вставьте OAuth-токен"); return; }
        setSaving(true); setMsg(null);
        try { const r = await connectYandexDiskToken({ token: yandexToken.trim() }); await mutate(); setMsg(`Яндекс.Диск подключен (${r.email || "аккаунт"}). Синхронизировано: ${r.syncedItems}`); setYandexToken(""); setYandexOAuthAvailable(null); }
        catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YDISK-TOKEN", e)); }
        finally { setSaving(false); }
    };

    const handleSaveHomeworkDefaultCloud = async () => {
        setSavingDefaultCloud(true);
        setMsg(null);
        try {
            await updateAccount({ homeworkDefaultCloud });
            await mutate();
            setMsg("Диск по умолчанию для домашней работы сохранён");
        } catch (e: any) {
            setMsg(codedErrorMessage("SETT-INT-HW-CLOUD", e));
        } finally {
            setSavingDefaultCloud(false);
        }
    };

    return (
        <div className="repeto-settings-stack">
            {msg && (
                <Card className="repeto-settings-section-card" view="outlined" style={{ padding: "12px 20px" }}>
                    <Text variant="body-1" className="repeto-settings-status-message repeto-settings-status-message--neutral">{msg}</Text>
                </Card>
            )}

            <Card className="repeto-settings-section-card repeto-settings-integrations-panel" view="outlined">
                <div className="repeto-settings-card__header">
                    <Text variant="subheader-2">Материалы</Text>
                </div>
                <div className="repeto-settings-integrations-panel__body">
                    <div className="repeto-settings-default-cloud">
                        <div className="repeto-settings-default-cloud__main">
                            <AppSelect
                                label="Диск для домашней работы"
                                options={homeworkDefaultCloudOptions}
                                value={[homeworkDefaultCloud]}
                                onUpdate={(value) => {
                                    const next = value[0] as HomeworkDefaultCloud | undefined;
                                    if (next) {
                                        setHomeworkDefaultCloud(next);
                                    }
                                }}
                                size="l"
                                width="max"
                            />
                            <Text variant="caption-2" color="secondary" className="repeto-settings-default-cloud__hint">
                                Если выбранный диск не подключен, система автоматически использует доступный.
                            </Text>
                        </div>
                        <Button
                            className="repeto-settings-default-cloud__save"
                            view="action"
                            size="l"
                            disabled={savingDefaultCloud}
                            onClick={handleSaveHomeworkDefaultCloud}
                        >
                            {savingDefaultCloud ? "Сохраняем..." : "Сохранить"}
                        </Button>
                    </div>

                    <div className="repeto-settings-integrations-list">
                        {defs.map((def) => {
                            const status = getStatus(def.id);
                            const isConnected = status === "connected";
                            return (
                                <div key={def.id} className="repeto-settings-integration-row">
                                    <div className="repeto-settings-integration-row__summary">
                                        <div className="repeto-settings-integration-row__icon" style={{ background: def.iconBg }}>
                                            <AnimatedSidebarIcon
                                                src={def.animatedIconPath}
                                                fallbackIcon={def.icon as IconData}
                                                play
                                                size={20}
                                            />
                                        </div>
                                        <div className="repeto-settings-integration-row__meta">
                                            <Text variant="body-1" className="repeto-settings-integration-row__title">{def.name}</Text>
                                            <Text variant="caption-2" color="secondary" className="repeto-settings-integration-row__desc">{def.description}</Text>
                                        </div>
                                        <div className="repeto-settings-integration-row__status">
                                            <Label theme={isConnected ? "success" : "normal"} size="s">{isConnected ? "Подключено" : "Не подключено"}</Label>
                                        </div>
                                        <Button
                                            className="repeto-settings-integration-row__action"
                                            view={isConnected ? "outlined" : "action"}
                                            size="l"
                                            disabled={saving}
                                            onClick={() => isConnected ? handleDisconnect(def.id) : handleConnect(def.id)}
                                        >
                                            {isConnected ? "Отключить" : "Подключить"}
                                        </Button>
                                    </div>

                                    {def.id === "yandex-calendar" && yandexCalOAuthAvailable === false && !hasYandexCalendar && (
                                        <div className="repeto-settings-integration-row__details repeto-settings-integration-row__details--form">
                                            <div className="repeto-settings-token-notice">
                                                <Text variant="caption-2">Автоподключение недоступно. Используйте ручное подключение по токену.</Text>
                                            </div>
                                            <AppField label="OAuth-токен Яндекса">
                                                <TextInput type="password" value={yandexCalToken} onUpdate={setYandexCalToken} placeholder="y0_AgAAAABk..." size="l" />
                                            </AppField>
                                            <Text variant="caption-2" color="secondary" className="repeto-settings-token-hint">
                                                Создайте приложение на <a href="https://oauth.yandex.ru/client/new" target="_blank" rel="noopener noreferrer">oauth.yandex.ru</a> и вставьте токен.
                                            </Text>
                                            <div className="repeto-settings-token-actions">
                                                <Button view="outlined" size="s" onClick={() => { setYandexCalOAuthAvailable(null); setMsg(null); }}>Отмена</Button>
                                                <Button view="action" size="s" onClick={handleYandexCalTokenConnect} disabled={saving || !yandexCalToken.trim()}>{saving ? "Подключаем..." : "Подключить"}</Button>
                                            </div>
                                        </div>
                                    )}

                                    {def.id === "yandex-calendar" && hasYandexCalendar && (
                                        <div className="repeto-settings-integration-row__details">
                                            <Text variant="caption-2" color="secondary">Аккаунт: <span>{settings?.yandexCalendarEmail || "—"}</span></Text>
                                        </div>
                                    )}

                                    {def.id === "yandex-disk" && yandexOAuthAvailable === false && !hasYandexDisk && (
                                        <div className="repeto-settings-integration-row__details repeto-settings-integration-row__details--form">
                                            <div className="repeto-settings-token-notice">
                                                <Text variant="caption-2">Автоподключение недоступно. Используйте ручное подключение по токену.</Text>
                                            </div>
                                            <AppField label="OAuth-токен Яндекс.Диска">
                                                <TextInput type="password" value={yandexToken} onUpdate={setYandexToken} placeholder="y0_AgAAAABk..." size="l" />
                                            </AppField>
                                            <Text variant="caption-2" color="secondary" className="repeto-settings-token-hint">
                                                Создайте приложение на <a href="https://oauth.yandex.ru/client/new" target="_blank" rel="noopener noreferrer">oauth.yandex.ru</a> и вставьте токен.
                                            </Text>
                                            <div className="repeto-settings-token-actions">
                                                <Button view="outlined" size="s" onClick={() => { setYandexOAuthAvailable(null); setMsg(null); }}>Отмена</Button>
                                                <Button view="action" size="s" onClick={handleYandexTokenConnect} disabled={saving || !yandexToken.trim()}>{saving ? "Подключаем..." : "Подключить"}</Button>
                                            </div>
                                        </div>
                                    )}

                                    {def.id === "yandex-disk" && hasYandexDisk && (
                                        <div className="repeto-settings-integration-row__details repeto-settings-integration-row__details--split">
                                            <Text variant="caption-2" color="secondary">Аккаунт: <span>{settings?.yandexDiskEmail || "—"}</span></Text>
                                            <Text variant="caption-2" color="secondary">Корневая папка: <span>{settings?.yandexDiskRootPath || "/"}</span></Text>
                                        </div>
                                    )}

                                    {def.id === "google-calendar" && hasGoogleCalendar && (
                                        <div className="repeto-settings-integration-row__details">
                                            <Text variant="caption-2" color="secondary">Аккаунт: <span>{settings?.googleCalendarEmail || "—"}</span></Text>
                                        </div>
                                    )}

                                    {def.id === "google-drive" && hasGoogleDrive && (
                                        <div className="repeto-settings-integration-row__details">
                                            <Text variant="caption-2" color="secondary">Аккаунт: <span>{settings?.googleDriveEmail || "—"}</span></Text>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Integrations;
