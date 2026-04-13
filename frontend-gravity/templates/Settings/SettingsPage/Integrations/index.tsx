import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Card, Text, Button, Icon, Label, TextInput } from "@gravity-ui/uikit";
import { Calendar, FolderOpen } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import {
    useSettings, disconnectIntegration,
    startYandexDiskConnect, completeYandexDiskConnect, connectYandexDiskToken,
    startGoogleCalendarConnect, completeGoogleCalendarConnect, syncGoogleCalendar, pullGoogleCalendar,
    startYandexCalendarConnect, connectYandexCalendarToken, syncYandexCalendar, pullYandexCalendar,
} from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";

type IntegrationDef = { id: string; name: string; description: string; icon: unknown; iconBg: string; };

const Integrations = () => {
    const router = useRouter();
    const { data: settings, mutate } = useSettings();
    const [yandexToken, setYandexToken] = useState("");
    const [yandexOAuthAvailable, setYandexOAuthAvailable] = useState<boolean | null>(null);
    const [yandexCalToken, setYandexCalToken] = useState("");
    const [yandexCalOAuthAvailable, setYandexCalOAuthAvailable] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const handledOAuthRef = useRef(false);

    const hasYandexDisk = !!settings?.hasYandexDisk;
    const hasGoogleCalendar = !!settings?.hasGoogleCalendar;
    const hasYandexCalendar = !!settings?.hasYandexCalendar;

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
        { id: "google-calendar", name: "Google Calendar", description: "Двусторонняя синхронизация расписания", icon: Calendar, iconBg: "rgba(66,133,244,0.1)" },
        { id: "yandex-calendar", name: "Яндекс.Календарь", description: "Двусторонняя синхронизация расписания", icon: Calendar, iconBg: "rgba(252,63,29,0.1)" },
        { id: "yandex-disk", name: "Яндекс.Диск", description: "Хранение и доступ к файлам учеников", icon: FolderOpen, iconBg: "rgba(252,63,29,0.1)" },
    ];

    const getStatus = (id: string) => {
        if (id === "google-calendar") return hasGoogleCalendar ? "connected" : "disconnected";
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

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {msg && (
                <Card view="outlined" style={{ padding: "12px 20px", background: "var(--g-color-base-float)" }}>
                    <Text variant="body-1" style={{ fontWeight: 600 }}>{msg}</Text>
                </Card>
            )}
            {defs.map((def) => {
                const status = getStatus(def.id);
                const isConnected = status === "connected";
                return (
                    <Card key={def.id} view="outlined" style={{ background: "var(--g-color-base-float)" }}>
                        <div style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: def.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 16, flexShrink: 0 }}>
                                    <Icon data={def.icon as IconData} size={20} />
                                </div>
                                <div style={{ flex: 1, marginRight: 16 }}>
                                    <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>{def.name}</Text>
                                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 2 }}>{def.description}</Text>
                                    <div style={{ marginTop: 6 }}>
                                        <Label theme={isConnected ? "success" : "normal"} size="s">{isConnected ? "Подключено" : "Не подключено"}</Label>
                                    </div>
                                </div>
                                <Button
                                    view={isConnected ? "outlined" : "action"}
                                    size="l"
                                    disabled={saving}
                                    onClick={() => isConnected ? handleDisconnect(def.id) : handleConnect(def.id)}
                                >
                                    {isConnected ? "Отключить" : "Подключить"}
                                </Button>
                            </div>

                            {/* Yandex Calendar token form */}
                            {def.id === "yandex-calendar" && yandexCalOAuthAvailable === false && !hasYandexCalendar && (
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--g-color-line-generic)", maxWidth: 420 }}>
                                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,193,7,0.1)", marginBottom: 12 }}>
                                        <Text variant="caption-2">Автоподключение недоступно. Используйте ручное подключение по токену.</Text>
                                    </div>
                                    <TextInput type="password" value={yandexCalToken} onUpdate={setYandexCalToken} placeholder="y0_AgAAAABk..." size="l" />
                                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 8 }}>
                                        Создайте приложение на <a href="https://oauth.yandex.ru/client/new" target="_blank" rel="noopener noreferrer" style={{ color: "var(--g-color-text-brand)" }}>oauth.yandex.ru</a> и вставьте токен.
                                    </Text>
                                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                        <Button view="outlined" size="s" onClick={() => { setYandexCalOAuthAvailable(null); setMsg(null); }}>Отмена</Button>
                                        <Button view="action" size="s" onClick={handleYandexCalTokenConnect} disabled={saving || !yandexCalToken.trim()}>{saving ? "Подключаем..." : "Подключить"}</Button>
                                    </div>
                                </div>
                            )}

                            {/* Yandex Calendar connected */}
                            {def.id === "yandex-calendar" && hasYandexCalendar && (
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--g-color-line-generic)" }}>
                                    <Text variant="caption-2" color="secondary">Аккаунт: <span style={{ fontWeight: 600, color: "var(--g-color-text-primary)" }}>{settings?.yandexCalendarEmail || "—"}</span></Text>
                                    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                                        <Button view="outlined" size="s" disabled={saving} onClick={async () => {
                                            setSaving(true); setMsg(null);
                                            try { const r = await syncYandexCalendar(); setMsg(`Синхронизация: ${r.synced} уроков отправлено в Яндекс.Календарь${r.errors ? `, ${r.errors} ошибок` : ""}`); }
                                            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YCAL-SYNC", e)); }
                                            finally { setSaving(false); }
                                        }}>Выгрузить</Button>
                                        <Button view="outlined" size="s" disabled={saving} onClick={async () => {
                                            setSaving(true); setMsg(null);
                                            try { const r = await pullYandexCalendar(); const p: string[] = []; if (r.updated) p.push(`${r.updated} обновлено`); if (r.cancelled) p.push(`${r.cancelled} отменено`); setMsg(p.length ? `Загружено из Яндекс.Календаря: ${p.join(", ")}` : "Изменений не найдено"); }
                                            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-YCAL-PULL", e)); }
                                            finally { setSaving(false); }
                                        }}>Загрузить</Button>
                                    </div>
                                </div>
                            )}

                            {/* Yandex Disk token form */}
                            {def.id === "yandex-disk" && yandexOAuthAvailable === false && !hasYandexDisk && (
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--g-color-line-generic)", maxWidth: 420 }}>
                                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,193,7,0.1)", marginBottom: 12 }}>
                                        <Text variant="caption-2">Автоподключение недоступно. Используйте ручное подключение по токену.</Text>
                                    </div>
                                    <TextInput type="password" value={yandexToken} onUpdate={setYandexToken} placeholder="y0_AgAAAABk..." size="l" />
                                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 8 }}>
                                        Создайте приложение на <a href="https://oauth.yandex.ru/client/new" target="_blank" rel="noopener noreferrer" style={{ color: "var(--g-color-text-brand)" }}>oauth.yandex.ru</a> и вставьте токен.
                                    </Text>
                                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                        <Button view="outlined" size="s" onClick={() => { setYandexOAuthAvailable(null); setMsg(null); }}>Отмена</Button>
                                        <Button view="action" size="s" onClick={handleYandexTokenConnect} disabled={saving || !yandexToken.trim()}>{saving ? "Подключаем..." : "Подключить"}</Button>
                                    </div>
                                </div>
                            )}

                            {/* Yandex Disk connected */}
                            {def.id === "yandex-disk" && hasYandexDisk && (
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--g-color-line-generic)" }}>
                                    <Text variant="caption-2" color="secondary">Аккаунт: <span style={{ fontWeight: 600, color: "var(--g-color-text-primary)" }}>{settings?.yandexDiskEmail || "—"}</span></Text>
                                </div>
                            )}

                            {/* Google Calendar connected */}
                            {def.id === "google-calendar" && hasGoogleCalendar && (
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--g-color-line-generic)" }}>
                                    <Text variant="caption-2" color="secondary">Аккаунт: <span style={{ fontWeight: 600, color: "var(--g-color-text-primary)" }}>{settings?.googleCalendarEmail || "—"}</span></Text>
                                    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                                        <Button view="outlined" size="s" disabled={saving} onClick={async () => {
                                            setSaving(true); setMsg(null);
                                            try { const r = await syncGoogleCalendar(); setMsg(`Синхронизация: ${r.synced} уроков отправлено в Google Calendar${r.errors ? `, ${r.errors} ошибок` : ""}`); }
                                            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-GCAL-SYNC", e)); }
                                            finally { setSaving(false); }
                                        }}>Выгрузить в GCal</Button>
                                        <Button view="outlined" size="s" disabled={saving} onClick={async () => {
                                            setSaving(true); setMsg(null);
                                            try { const r = await pullGoogleCalendar(); const p: string[] = []; if (r.updated) p.push(`${r.updated} обновлено`); if (r.cancelled) p.push(`${r.cancelled} отменено`); setMsg(p.length ? `Загружено из GCal: ${p.join(", ")}` : "Изменений в Google Calendar не найдено"); }
                                            catch (e: any) { setMsg(codedErrorMessage("SETT-INT-GCAL-PULL", e)); }
                                            finally { setSaving(false); }
                                        }}>Загрузить из GCal</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default Integrations;
