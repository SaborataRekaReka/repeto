import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Icon from "@/components/Icon";
import {
    useSettings,
    disconnectIntegration,
    startYandexDiskConnect,
    completeYandexDiskConnect,
    connectYandexDiskToken,
    startGoogleCalendarConnect,
    completeGoogleCalendarConnect,
    syncGoogleCalendar,
    pullGoogleCalendar,
    startYandexCalendarConnect,
    connectYandexCalendarToken,
    syncYandexCalendar,
    pullYandexCalendar,
} from "@/hooks/useSettings";

type IntegrationStatus = "connected" | "disconnected" | "disabled";

type Integration = {
    id: string;
    name: string;
    description: string;
    status: IntegrationStatus;
    icon: string;
};

const statusLabel = (status: string) => {
    switch (status) {
        case "connected":
            return "Подключено";
        case "disconnected":
            return "Не подключено";
        case "disabled":
            return "Скоро";
        default:
            return "";
    }
};

const statusColor = (status: string) => {
    switch (status) {
        case "connected":
            return "text-green-1";
        case "disconnected":
            return "text-n-3 dark:text-white/50";
        case "disabled":
            return "text-yellow-1";
        default:
            return "";
    }
};

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

    useEffect(() => {
        if (!router.isReady || handledOAuthRef.current) {
            return;
        }

        // Implicit OAuth flow: token comes in URL hash (#access_token=...&state=...)
        if (typeof window !== "undefined" && window.location.hash) {
            const hashParams = new URLSearchParams(
                window.location.hash.replace(/^#/, "")
            );
            const accessToken = hashParams.get("access_token");

            if (accessToken) {
                handledOAuthRef.current = true;

                const pendingIntegration = sessionStorage.getItem("pending_yandex_integration") || "yandex-disk";
                sessionStorage.removeItem("pending_yandex_integration");

                if (pendingIntegration === "yandex-calendar") {
                    const connectCal = async () => {
                        setSaving(true);
                        setMsg(null);
                        try {
                            const result = await connectYandexCalendarToken({
                                token: accessToken,
                            });
                            await mutate();
                            setMsg(
                                `Яндекс.Календарь подключен (${result.email || "аккаунт"})`
                            );
                        } catch (e: any) {
                            setMsg(
                                e?.message ||
                                    "Не удалось подключить Яндекс.Календарь"
                            );
                        } finally {
                            setSaving(false);
                            window.history.replaceState(
                                null,
                                "",
                                "/settings?tab=integrations"
                            );
                        }
                    };

                    connectCal();
                    return;
                }

                const connectToken = async () => {
                    setSaving(true);
                    setMsg(null);
                    try {
                        const result = await connectYandexDiskToken({
                            token: accessToken,
                        });
                        await mutate();
                        setMsg(
                            `Яндекс.Диск подключен (${result.email || "аккаунт"}). Синхронизировано: ${result.syncedItems}`
                        );
                    } catch (e: any) {
                        setMsg(
                            e?.message ||
                                "Не удалось завершить подключение Яндекс.Диска"
                        );
                    } finally {
                        setSaving(false);
                        window.history.replaceState(
                            null,
                            "",
                            "/settings?tab=integrations"
                        );
                    }
                };

                connectToken();
                return;
            }
        }

        // Legacy code-based OAuth flow (when client_secret is configured)
        const code = router.query.code;
        const state = router.query.state;
        const integration = router.query.integration;

        // Google Calendar OAuth callback
        if (
            integration === "google-calendar" &&
            typeof code === "string"
        ) {
            handledOAuthRef.current = true;

            const completeGCal = async () => {
                setSaving(true);
                setMsg(null);
                try {
                    const result = await completeGoogleCalendarConnect({ code });
                    await mutate();
                    setMsg(
                        `Google Calendar подключен (${result.email || "аккаунт"})`
                    );
                } catch (e: any) {
                    setMsg(e?.message || "Не удалось подключить Google Calendar");
                } finally {
                    setSaving(false);
                    router.replace(
                        {
                            pathname: "/settings",
                            query: { tab: "integrations" },
                        },
                        undefined,
                        { shallow: true }
                    );
                }
            };

            completeGCal();
            return;
        }

        // Yandex Disk code-based OAuth flow
        if (
            integration !== "yandex-disk" ||
            typeof code !== "string" ||
            typeof state !== "string"
        ) {
            return;
        }

        handledOAuthRef.current = true;

        const complete = async () => {
            setSaving(true);
            setMsg(null);
            try {
                const result = await completeYandexDiskConnect({ code, state });
                await mutate();
                setMsg(
                    `Яндекс.Диск подключен: ${result.rootPath}. Синхронизировано: ${result.syncedItems}`
                );
            } catch (e: any) {
                setMsg(e?.message || "Не удалось завершить подключение Яндекс.Диска");
            } finally {
                setSaving(false);
                router.replace(
                    {
                        pathname: "/settings",
                        query: { tab: "integrations" },
                    },
                    undefined,
                    { shallow: true }
                );
            }
        };

        complete();
    }, [router, mutate]);

    const integrations: Integration[] = [
        {
            id: "google-calendar",
            name: "Google Calendar",
            description: "Двусторонняя синхронизация расписания",
            status: hasGoogleCalendar ? "connected" : "disconnected",
            icon: "calendar",
        },
        {
            id: "yandex-calendar",
            name: "Яндекс.Календарь",
            description: "Двусторонняя синхронизация расписания",
            status: hasYandexCalendar ? "connected" : "disconnected",
            icon: "calendar",
        },
        {
            id: "yandex-disk",
            name: "Яндекс.Диск",
            description: "Хранение и доступ к файлам учеников",
            status: hasYandexDisk ? "connected" : "disconnected",
            icon: "folder",
        },
    ];

    const handleConnect = async (id: string) => {
        if (id === "google-calendar") {
            setSaving(true);
            setMsg(null);
            try {
                const result = await startGoogleCalendarConnect();
                if (result.oauthConfigured && "authUrl" in result) {
                    window.location.href = result.authUrl;
                    return;
                }
                setMsg(
                    "Google Calendar OAuth не настроен на сервере. Укажите GOOGLE_CALENDAR_CLIENT_ID и GOOGLE_CALENDAR_CLIENT_SECRET в .env"
                );
            } catch (e: any) {
                setMsg(
                    e?.message || "Ошибка подключения Google Calendar"
                );
            } finally {
                setSaving(false);
            }
            return;
        }

        if (id === "yandex-calendar") {
            setSaving(true);
            setMsg(null);
            try {
                const result = await startYandexCalendarConnect();
                if (result.oauthConfigured && "authUrl" in result) {
                    sessionStorage.setItem("pending_yandex_integration", "yandex-calendar");
                    window.location.href = result.authUrl;
                    return;
                }
                // OAuth not configured — show manual token form
                setYandexCalOAuthAvailable(false);
            } catch (e: any) {
                setMsg(e?.message || "Ошибка подключения Яндекс.Календаря");
            } finally {
                setSaving(false);
            }
            return;
        }

        if (id === "yandex-disk") {
            // Try OAuth first, fallback to token form
            setSaving(true);
            setMsg(null);
            try {
                const result = await startYandexDiskConnect();

                if (result.oauthConfigured && 'authUrl' in result) {
                    window.location.href = result.authUrl;
                    return;
                }

                // OAuth not configured — show manual token form
                setYandexOAuthAvailable(false);
            } catch (e: any) {
                setMsg(e?.message || "Ошибка подключения Яндекс.Диска");
            } finally {
                setSaving(false);
            }
        }
    };

    const handleDisconnect = async (id: string) => {
        setSaving(true);
        try {
            await disconnectIntegration(id);
            await mutate();
        } catch (e: any) {
            setMsg(e?.message || "Ошибка");
        } finally {
            setSaving(false);
        }
    };

    const handleYandexCalTokenConnect = async () => {
        if (!yandexCalToken.trim()) {
            setMsg("Вставьте OAuth-токен");
            return;
        }

        setSaving(true);
        setMsg(null);
        try {
            const result = await connectYandexCalendarToken({
                token: yandexCalToken.trim(),
            });
            await mutate();
            setMsg(
                `Яндекс.Календарь подключен (${result.email || "аккаунт"})`
            );
            setYandexCalToken("");
            setYandexCalOAuthAvailable(null);
        } catch (e: any) {
            setMsg(e?.message || "Ошибка подключения Яндекс.Календаря");
        } finally {
            setSaving(false);
        }
    };

    const handleYandexTokenConnect = async () => {
        if (!yandexToken.trim()) {
            setMsg("Вставьте OAuth-токен");
            return;
        }

        setSaving(true);
        setMsg(null);
        try {
            const result = await connectYandexDiskToken({
                token: yandexToken.trim(),
            });
            await mutate();
            setMsg(
                `Яндекс.Диск подключен (${result.email || "аккаунт"}). Синхронизировано: ${result.syncedItems}`
            );
            setYandexToken("");
            setYandexOAuthAvailable(null);
        } catch (e: any) {
            setMsg(e?.message || "Ошибка подключения Яндекс.Диска");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {msg && (
                <div className="card p-4 text-xs font-bold text-n-1 dark:text-white">
                    {msg}
                </div>
            )}
            {integrations.map((item) => (
                <div key={item.id} className="card">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-xl bg-n-4/50 dark:bg-white/10">
                                <Icon
                                    className="icon-20 dark:fill-white"
                                    name={item.icon}
                                />
                            </div>
                            <div className="mr-auto">
                                <div className="text-sm font-bold">
                                    {item.name}
                                </div>
                                <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                    {item.description}
                                </div>
                                <div
                                    className={`mt-1 text-xs font-bold ${statusColor(
                                        item.status
                                    )}`}
                                >
                                    {statusLabel(item.status)}
                                </div>
                            </div>
                            <button
                                className={`btn-small min-w-[8rem] ${
                                    item.status === "disabled"
                                        ? "btn-stroke opacity-50 pointer-events-none"
                                        : item.status === "connected"
                                        ? "btn-stroke"
                                        : "btn-purple"
                                }`}
                                disabled={item.status === "disabled" || saving}
                                onClick={() =>
                                    item.status === "connected"
                                        ? handleDisconnect(item.id)
                                        : handleConnect(item.id)
                                }
                            >
                                {item.status === "connected"
                                    ? "Отключить"
                                    : item.status === "disabled"
                                    ? "Скоро"
                                    : "Подключить"}
                            </button>
                        </div>
                        {item.id === "yandex-calendar" && yandexCalOAuthAvailable === false && !hasYandexCalendar && (
                            <div className="mt-4 max-w-md space-y-3 pt-4 border-t border-n-1 dark:border-white">
                                <div className="rounded-lg bg-yellow-1/10 p-3 text-xs text-n-1 dark:text-white">
                                    OAuth-авторизация не настроена на сервере. Вы можете подключить Календарь вручную по токену.
                                </div>
                                <input
                                    type="password"
                                    className="w-full rounded-lg border border-n-1 dark:border-white bg-transparent px-4 py-2 text-sm"
                                    placeholder="y0_AgAAAABk..."
                                    value={yandexCalToken}
                                    onChange={(e) => setYandexCalToken(e.target.value)}
                                />
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    Как получить: создайте приложение на{" "}
                                    <a
                                        href="https://oauth.yandex.ru/client/new"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-purple-1"
                                    >
                                        oauth.yandex.ru
                                    </a>
                                    , получите токен с доступом к Яндекс.Календарю и вставьте сюда.
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="btn-stroke btn-small"
                                        onClick={() => {
                                            setYandexCalOAuthAvailable(null);
                                            setMsg(null);
                                        }}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        className="btn-purple btn-small"
                                        onClick={handleYandexCalTokenConnect}
                                        disabled={saving || !yandexCalToken.trim()}
                                    >
                                        {saving ? "Подключаем..." : "Подключить"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {item.id === "yandex-calendar" && hasYandexCalendar && (
                            <div className="mt-4 max-w-md space-y-3 pt-4 border-t border-n-1 dark:border-white">
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    Аккаунт: <span className="font-bold text-n-1 dark:text-white">{settings?.yandexCalendarEmail || "—"}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="btn-stroke btn-small"
                                        disabled={saving}
                                        onClick={async () => {
                                            setSaving(true);
                                            setMsg(null);
                                            try {
                                                const r = await syncYandexCalendar();
                                                setMsg(
                                                    `Синхронизация: ${r.synced} уроков отправлено в Яндекс.Календарь` +
                                                    (r.errors ? `, ${r.errors} ошибок` : "")
                                                );
                                            } catch (e: any) {
                                                setMsg(e?.message || "Ошибка синхронизации");
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                    >
                                        {saving ? "Синхронизация..." : "Выгрузить"}
                                    </button>
                                    <button
                                        className="btn-stroke btn-small"
                                        disabled={saving}
                                        onClick={async () => {
                                            setSaving(true);
                                            setMsg(null);
                                            try {
                                                const r = await pullYandexCalendar();
                                                const parts: string[] = [];
                                                if (r.updated) parts.push(`${r.updated} обновлено`);
                                                if (r.cancelled) parts.push(`${r.cancelled} отменено`);
                                                setMsg(
                                                    parts.length
                                                        ? `Загружено из Яндекс.Календаря: ${parts.join(", ")}`
                                                        : "Изменений в Яндекс.Календаре не найдено"
                                                );
                                            } catch (e: any) {
                                                setMsg(e?.message || "Ошибка загрузки");
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                    >
                                        {saving ? "Загрузка..." : "Загрузить"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {item.id === "yandex-disk" && yandexOAuthAvailable === false && !hasYandexDisk && (
                            <div className="mt-4 max-w-md space-y-3 pt-4 border-t border-n-1 dark:border-white">
                                <div className="rounded-lg bg-yellow-1/10 p-3 text-xs text-n-1 dark:text-white">
                                    OAuth-авторизация не настроена на сервере. Вы можете подключить Диск вручную по токену.
                                </div>
                                <input
                                    type="password"
                                    className="w-full rounded-lg border border-n-1 dark:border-white bg-transparent px-4 py-2 text-sm"
                                    placeholder="y0_AgAAAABk..."
                                    value={yandexToken}
                                    onChange={(e) => setYandexToken(e.target.value)}
                                />
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    Как получить: создайте приложение на{" "}
                                    <a
                                        href="https://oauth.yandex.ru/client/new"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-purple-1"
                                    >
                                        oauth.yandex.ru
                                    </a>
                                    , получите токен и вставьте сюда.
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="btn-stroke btn-small"
                                        onClick={() => {
                                            setYandexOAuthAvailable(null);
                                            setMsg(null);
                                        }}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        className="btn-purple btn-small"
                                        onClick={handleYandexTokenConnect}
                                        disabled={saving || !yandexToken.trim()}
                                    >
                                        {saving ? "Подключаем..." : "Подключить"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {item.id === "yandex-disk" && hasYandexDisk && (
                            <div className="mt-4 max-w-md space-y-2 pt-4 border-t border-n-1 dark:border-white">
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    Аккаунт: <span className="font-bold text-n-1 dark:text-white">{settings?.yandexDiskEmail || "—"}</span>
                                </div>
                            </div>
                        )}

                        {item.id === "google-calendar" && hasGoogleCalendar && (
                            <div className="mt-4 max-w-md space-y-3 pt-4 border-t border-n-1 dark:border-white">
                                <div className="text-xs text-n-3 dark:text-white/50">
                                    Аккаунт: <span className="font-bold text-n-1 dark:text-white">{settings?.googleCalendarEmail || "—"}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="btn-stroke btn-small"
                                        disabled={saving}
                                        onClick={async () => {
                                            setSaving(true);
                                            setMsg(null);
                                            try {
                                                const r = await syncGoogleCalendar();
                                                setMsg(
                                                    `Синхронизация: ${r.synced} уроков отправлено в Google Calendar` +
                                                    (r.errors ? `, ${r.errors} ошибок` : "")
                                                );
                                            } catch (e: any) {
                                                setMsg(e?.message || "Ошибка синхронизации");
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                    >
                                        {saving ? "Синхронизация..." : "Выгрузить в GCal"}
                                    </button>
                                    <button
                                        className="btn-stroke btn-small"
                                        disabled={saving}
                                        onClick={async () => {
                                            setSaving(true);
                                            setMsg(null);
                                            try {
                                                const r = await pullGoogleCalendar();
                                                const parts: string[] = [];
                                                if (r.updated) parts.push(`${r.updated} обновлено`);
                                                if (r.cancelled) parts.push(`${r.cancelled} отменено`);
                                                setMsg(
                                                    parts.length
                                                        ? `Загружено из GCal: ${parts.join(", ")}`
                                                        : "Изменений в Google Calendar не найдено"
                                                );
                                            } catch (e: any) {
                                                setMsg(e?.message || "Ошибка загрузки");
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                    >
                                        {saving ? "Загрузка..." : "Загрузить из GCal"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Integrations;
