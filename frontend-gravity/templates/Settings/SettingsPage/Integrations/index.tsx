import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Card, Text, Button, Label, TextInput, Checkbox } from "@gravity-ui/uikit";
import { Calendar, FolderOpen } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import {
    useSettings, disconnectIntegration,
    updateAccount,
    connectYukassa,
    startYandexDiskConnect, completeYandexDiskConnect, connectYandexDiskToken,
    startGoogleCalendarConnect, completeGoogleCalendarConnect,
    startGoogleDriveConnect, completeGoogleDriveConnect,
    startYandexCalendarConnect, connectYandexCalendarToken,
} from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";
import AppSelect from "@/components/AppSelect";
import AppField from "@/components/AppField";
import {
    LEGAL_DOCUMENT_HASH,
    LEGAL_VERSION,
    TUTOR_REPETO_PAYMENT_HINT_TEXT,
    TUTOR_REPETO_PAYMENT_STATUS_TEXT,
    TUTOR_REPETO_PAYMENT_TERMS_TEXT,
    TUTOR_REPETO_PAYMENT_UNAVAILABLE_TEXT,
} from "@/lib/legal";

type IntegrationDef = {
    id: string;
    name: string;
    description: string;
    icon: unknown;
    iconBg: string;
    animatedIconPath: string;
};
type HomeworkDefaultCloud = "YANDEX_DISK" | "GOOGLE_DRIVE";
type TaxStatusValue = "SELF_EMPLOYED" | "SOLE_TRADER" | "LEGAL_ENTITY";
type PayoutMethodValue = "CARD" | "YOOMONEY" | "BANK_ACCOUNT";

const homeworkDefaultCloudOptions = [
    { value: "YANDEX_DISK", content: "Яндекс.Диск" },
    { value: "GOOGLE_DRIVE", content: "Google Drive" },
];

const taxStatusOptions = [
    { value: "SELF_EMPLOYED", content: "Самозанятый" },
    { value: "SOLE_TRADER", content: "ИП" },
];

const payoutMethodOptionsBase = [
    { value: "CARD", content: "Банковская карта" },
];

const payoutYoomoneyOption = { value: "YOOMONEY", content: "ЮMoney" };

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
    const [taxStatus, setTaxStatus] = useState<TaxStatusValue>("SELF_EMPLOYED");
    const [taxInn, setTaxInn] = useState("");
    const [taxDisplayName, setTaxDisplayName] = useState("");
    const [soleTraderOgrnip, setSoleTraderOgrnip] = useState("");
    const [legalKpp, setLegalKpp] = useState("");
    const [legalOgrn, setLegalOgrn] = useState("");
    const [legalCheckingAccount, setLegalCheckingAccount] = useState("");
    const [legalBik, setLegalBik] = useState("");
    const [legalBankName, setLegalBankName] = useState("");
    const [legalCorrespondentAccount, setLegalCorrespondentAccount] = useState("");
    const [payoutMethod, setPayoutMethod] = useState<PayoutMethodValue>("CARD");
    const [paymentMethodToken, setPaymentMethodToken] = useState("");
    const [payoutToken, setPayoutToken] = useState("");
    const [paymentMethodType, setPaymentMethodType] = useState("CARD");
    const [payoutDetailsMasked, setPayoutDetailsMasked] = useState("");
    const [paymentConnectionStatus, setPaymentConnectionStatus] = useState<string>("NOT_CONFIGURED");
    const [paymentConnectionStatusReason, setPaymentConnectionStatusReason] = useState<string>("");
    const [paymentStatusConsent, setPaymentStatusConsent] = useState(false);
    const [paymentTermsConsent, setPaymentTermsConsent] = useState(false);
    const handledOAuthRef = useRef(false);

    const hasYukassa = !!settings?.hasYukassa;
    const hasYandexDisk = !!settings?.hasYandexDisk;
    const hasGoogleDrive = !!settings?.hasGoogleDrive;
    const hasGoogleCalendar = !!settings?.hasGoogleCalendar;
    const hasYandexCalendar = !!settings?.hasYandexCalendar;
    const supportsBankAccountPayout = !!settings?.supportsBankAccountPayout;
    const supportsYoomoneyPayout = !!settings?.supportsYoomoneyPayout;
    const supportsLegalEntityPayout = !!settings?.supportsLegalEntityPayout;
    const repetoPaymentsSectionVisible = !!settings?.repetoPaymentsSectionVisible;

    const availableTaxStatusOptions = supportsLegalEntityPayout
        ? [...taxStatusOptions, { value: "LEGAL_ENTITY", content: "Юридическое лицо" }]
        : taxStatusOptions;

    const payoutMethodOptions = (() => {
        const next = [...payoutMethodOptionsBase];
        if (supportsYoomoneyPayout) next.push(payoutYoomoneyOption);
        if (supportsBankAccountPayout && (taxStatus === "SOLE_TRADER" || taxStatus === "LEGAL_ENTITY")) {
            next.push({ value: "BANK_ACCOUNT", content: "Банковский счёт" });
        }
        return next;
    })();

    useEffect(() => {
        if (taxStatus === "LEGAL_ENTITY") {
            setPayoutMethod("BANK_ACCOUNT");
            return;
        }
        if (payoutMethod === "YOOMONEY" && !supportsYoomoneyPayout) {
            setPayoutMethod("CARD");
            return;
        }
        if (payoutMethod === "BANK_ACCOUNT" && !supportsBankAccountPayout) {
            setPayoutMethod("CARD");
        }
    }, [taxStatus, payoutMethod, supportsYoomoneyPayout, supportsBankAccountPayout]);

    useEffect(() => {
        const value = settings?.homeworkDefaultCloud;
        if (value === "GOOGLE_DRIVE" || value === "YANDEX_DISK") {
            setHomeworkDefaultCloud(value);
        }
    }, [settings?.homeworkDefaultCloud]);

    useEffect(() => {
        if (!settings) return;
        if (
            settings.taxStatus === "LEGAL_ENTITY" && supportsLegalEntityPayout
        ) {
            setTaxStatus(settings.taxStatus);
        } else if (settings.taxStatus === "SOLE_TRADER") {
            setTaxStatus("SOLE_TRADER");
        } else {
            setTaxStatus("SELF_EMPLOYED");
        }
        setTaxInn(String(settings.taxInn || ""));
        setTaxDisplayName(String(settings.taxDisplayName || ""));
        setSoleTraderOgrnip(String(settings.paymentSoleTraderOgrnip || ""));
        setLegalKpp(String(settings.paymentLegalKpp || ""));
        setLegalOgrn(String(settings.paymentLegalOgrn || ""));
        setLegalCheckingAccount(String(settings.paymentLegalCheckingAccount || ""));
        setLegalBik(String(settings.paymentLegalBik || ""));
        setLegalBankName(String(settings.paymentLegalBankName || ""));
        setLegalCorrespondentAccount(String(settings.paymentLegalCorrespondentAccount || ""));
        if (
            settings.paymentPayoutMethod === "CARD" ||
            settings.paymentPayoutMethod === "YOOMONEY" ||
            settings.paymentPayoutMethod === "BANK_ACCOUNT"
        ) {
            setPayoutMethod(settings.paymentPayoutMethod);
        } else {
            setPayoutMethod("CARD");
        }
        setPaymentMethodToken("");
        setPayoutToken("");
        setPaymentMethodType(String(settings.paymentMethodType || "CARD"));
        setPayoutDetailsMasked(String(settings.paymentPayoutDetailsMasked || ""));
        setPaymentConnectionStatus(String(settings.paymentConnectionStatus || "NOT_CONFIGURED"));
        setPaymentConnectionStatusReason(String(settings.paymentConnectionStatusReason || ""));
    }, [
        settings?.taxStatus,
        settings?.taxInn,
        settings?.taxDisplayName,
        settings?.paymentSoleTraderOgrnip,
        settings?.paymentLegalKpp,
        settings?.paymentLegalOgrn,
        settings?.paymentLegalCheckingAccount,
        settings?.paymentLegalBik,
        settings?.paymentLegalBankName,
        settings?.paymentLegalCorrespondentAccount,
        settings?.paymentPayoutMethod,
        settings?.paymentMethodType,
        settings?.paymentPayoutDetailsMasked,
        settings?.paymentConnectionStatus,
        settings?.paymentConnectionStatusReason,
        supportsLegalEntityPayout,
    ]);

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

    const handleBindCardForPayout = () => {
        const last4 = String(Math.floor(1000 + Math.random() * 9000));
        const tokenSuffix = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
        setPaymentMethodToken(`pm_${tokenSuffix}`);
        setPayoutToken(`pt_${tokenSuffix}`);
        setPaymentMethodType("CARD");
        setPayoutDetailsMasked(`**** ${last4}`);
        setMsg(`Карта привязана: **** ${last4}`);
    };

    const effectivePayoutMethod: PayoutMethodValue =
        taxStatus === "LEGAL_ENTITY" ? "BANK_ACCOUNT" : payoutMethod;

    const handleConnectYukassa = async () => {
        if (!taxInn.trim()) {
            setMsg("Укажите ИНН");
            return;
        }

        if (!taxDisplayName.trim()) {
            setMsg("Укажите ФИО получателя или наименование организации");
            return;
        }

        if (taxStatus === "LEGAL_ENTITY" && !supportsLegalEntityPayout) {
            setMsg("Выплаты для юридических лиц временно недоступны");
            return;
        }

        if (effectivePayoutMethod === "BANK_ACCOUNT" && !supportsBankAccountPayout) {
            setMsg("Выплата на банковский счёт временно недоступна");
            return;
        }

        if (effectivePayoutMethod === "YOOMONEY" && !supportsYoomoneyPayout) {
            setMsg("Выплаты через ЮMoney пока недоступны");
            return;
        }

        if (effectivePayoutMethod === "CARD" && (!paymentMethodToken || !payoutDetailsMasked)) {
            setMsg("Нужно привязать карту для выплат");
            return;
        }

        if (effectivePayoutMethod === "YOOMONEY" && !payoutToken.trim()) {
            setMsg("Укажите идентификатор кошелька ЮMoney");
            return;
        }

        if (
            effectivePayoutMethod === "BANK_ACCOUNT" &&
            (!legalCheckingAccount.trim() || !legalBik.trim() || !legalBankName.trim())
        ) {
            setMsg("Для выплат на счёт укажите р/с, БИК и банк");
            return;
        }

        if (taxStatus === "LEGAL_ENTITY") {
            if (!legalKpp.trim()) {
                setMsg("Укажите КПП");
                return;
            }
            if (!legalOgrn.trim()) {
                setMsg("Укажите ОГРН");
                return;
            }
            if (!legalCorrespondentAccount.trim()) {
                setMsg("Укажите корреспондентский счёт");
                return;
            }
        }

        if (!paymentStatusConsent) {
            setMsg("Подтвердите налоговый статус и достоверность реквизитов");
            return;
        }

        if (!paymentTermsConsent) {
            setMsg("Примите условия приёма оплат через Repeto");
            return;
        }

        setSaving(true);
        setMsg(null);
        try {
            await connectYukassa({
                taxStatus,
                taxInn: taxInn.trim(),
                taxDisplayName: taxDisplayName.trim(),
                payoutMethod: effectivePayoutMethod,
                paymentMethodToken: paymentMethodToken || undefined,
                payoutToken: payoutToken || undefined,
                paymentMethodType: paymentMethodType || undefined,
                maskedPan: payoutDetailsMasked || undefined,
                soleTraderOgrnip: soleTraderOgrnip.trim() || undefined,
                legalKpp: legalKpp.trim() || undefined,
                legalOgrn: legalOgrn.trim() || undefined,
                legalCheckingAccount: legalCheckingAccount.trim() || undefined,
                legalBik: legalBik.trim() || undefined,
                legalBankName: legalBankName.trim() || undefined,
                legalCorrespondentAccount: legalCorrespondentAccount.trim() || undefined,
                paymentStatusConsentAccepted: true,
                paymentTermsAccepted: true,
                paymentStatusConsentText: TUTOR_REPETO_PAYMENT_STATUS_TEXT,
                paymentTermsConsentText: TUTOR_REPETO_PAYMENT_TERMS_TEXT,
                legalVersion: LEGAL_VERSION,
                legalDocumentHash: LEGAL_DOCUMENT_HASH,
            });
            setPaymentStatusConsent(false);
            setPaymentTermsConsent(false);
            await mutate();
            setMsg("Данные выплат сохранены");
        } catch (e: any) {
            setMsg(codedErrorMessage("SETT-INT-YUKASSA-CONNECT", e));
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnectYukassa = async () => {
        setSaving(true);
        setMsg(null);
        try {
            await disconnectIntegration("yukassa");
            await mutate();
            setMsg("ЮKassa отключена");
        } catch (e: any) {
            setMsg(codedErrorMessage("SETT-INT-YUKASSA-DISCONNECT", e));
        } finally {
            setSaving(false);
        }
    };

    const paymentStatusMeta = (() => {
        if (paymentConnectionStatus === "ACTIVE") {
            return { text: "Активно", theme: "success" as const };
        }
        if (paymentConnectionStatus === "PENDING_REVIEW") {
            return { text: "Ожидает проверки", theme: "warning" as const };
        }
        if (paymentConnectionStatus === "REJECTED") {
            return { text: "Отклонено", theme: "danger" as const };
        }
        if (paymentConnectionStatus === "UNAVAILABLE") {
            return { text: "Недоступно", theme: "normal" as const };
        }
        return { text: "Не настроено", theme: "normal" as const };
    })();

    return (
        <div className="repeto-settings-stack">
            {msg && (
                <Card className="repeto-settings-section-card" view="outlined" style={{ padding: "12px 20px" }}>
                    <Text variant="body-1" className="repeto-settings-status-message repeto-settings-status-message--neutral">{msg}</Text>
                </Card>
            )}

            {repetoPaymentsSectionVisible && (
                <Card className="repeto-settings-section-card" view="outlined">
                    <div className="repeto-settings-card__header">
                        <Text variant="subheader-2">Приём оплат через Repeto</Text>
                    </div>
                    <div className="repeto-settings-card__body" style={{ padding: 24, display: "grid", gap: 12 }}>
                        <Text variant="body-1" color="secondary">
                            {TUTOR_REPETO_PAYMENT_HINT_TEXT}
                        </Text>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <Text variant="body-2" color="secondary">Статус подключения:</Text>
                            <Label theme={paymentStatusMeta.theme} size="s">{paymentStatusMeta.text}</Label>
                            {!!paymentConnectionStatusReason && (
                                <Text variant="caption-2" color="secondary">{paymentConnectionStatusReason}</Text>
                            )}
                        </div>

                        <AppSelect
                            label="Налоговый статус"
                            options={availableTaxStatusOptions}
                            value={[taxStatus]}
                            onUpdate={(value) => {
                                const next = value[0] as TaxStatusValue | undefined;
                                if (next) setTaxStatus(next);
                            }}
                            size="l"
                            width="max"
                        />

                        <AppField label="ИНН" required>
                            <TextInput
                                size="l"
                                value={taxInn}
                                onUpdate={setTaxInn}
                                placeholder="123456789012"
                            />
                        </AppField>

                        <AppField
                            label={
                                taxStatus === "LEGAL_ENTITY"
                                    ? "Наименование организации"
                                    : taxStatus === "SOLE_TRADER"
                                        ? "ФИО ИП"
                                        : "ФИО"
                            }
                            required
                        >
                            <TextInput
                                size="l"
                                value={taxDisplayName}
                                onUpdate={setTaxDisplayName}
                                placeholder={taxStatus === "LEGAL_ENTITY" ? "ООО Репетитор Плюс" : "Иванов Иван Иванович"}
                            />
                        </AppField>

                        {taxStatus === "SOLE_TRADER" && (
                            <AppField label="ОГРНИП">
                                <TextInput
                                    size="l"
                                    value={soleTraderOgrnip}
                                    onUpdate={setSoleTraderOgrnip}
                                    placeholder="123456789012345"
                                />
                            </AppField>
                        )}

                        {taxStatus !== "LEGAL_ENTITY" && (
                            <AppSelect
                                label="Способ выплаты"
                                options={payoutMethodOptions}
                                value={[payoutMethod]}
                                onUpdate={(value) => {
                                    const next = value[0] as PayoutMethodValue | undefined;
                                    if (next) setPayoutMethod(next);
                                }}
                                size="l"
                                width="max"
                            />
                        )}

                        {effectivePayoutMethod === "CARD" && (
                            <div style={{ display: "grid", gap: 8 }}>
                                <Button view="outlined-action" size="l" disabled={saving} onClick={handleBindCardForPayout}>
                                    Привязать карту для выплат
                                </Button>
                                {!!payoutDetailsMasked && (
                                    <Text variant="body-2" color="secondary">Карта привязана: {payoutDetailsMasked}</Text>
                                )}
                            </div>
                        )}

                        {effectivePayoutMethod === "YOOMONEY" && (
                            <AppField label="ЮMoney ID" required>
                                <TextInput
                                    size="l"
                                    value={payoutToken}
                                    onUpdate={setPayoutToken}
                                    placeholder="4100XXXXXXXX1234"
                                />
                            </AppField>
                        )}

                        {(effectivePayoutMethod === "BANK_ACCOUNT" || taxStatus === "LEGAL_ENTITY") && (
                            <div style={{ display: "grid", gap: 12 }}>
                                <AppField label="Расчётный счёт" required={taxStatus === "LEGAL_ENTITY"}>
                                    <TextInput
                                        size="l"
                                        value={legalCheckingAccount}
                                        onUpdate={setLegalCheckingAccount}
                                        placeholder="40702810900000000001"
                                    />
                                </AppField>
                                <AppField label="БИК" required={taxStatus === "LEGAL_ENTITY"}>
                                    <TextInput
                                        size="l"
                                        value={legalBik}
                                        onUpdate={setLegalBik}
                                        placeholder="044525225"
                                    />
                                </AppField>
                                <AppField label="Банк" required={taxStatus === "LEGAL_ENTITY"}>
                                    <TextInput
                                        size="l"
                                        value={legalBankName}
                                        onUpdate={setLegalBankName}
                                        placeholder="АО Банк"
                                    />
                                </AppField>
                                {taxStatus === "LEGAL_ENTITY" && (
                                    <>
                                        <AppField label="КПП" required>
                                            <TextInput
                                                size="l"
                                                value={legalKpp}
                                                onUpdate={setLegalKpp}
                                                placeholder="770101001"
                                            />
                                        </AppField>
                                        <AppField label="ОГРН" required>
                                            <TextInput
                                                size="l"
                                                value={legalOgrn}
                                                onUpdate={setLegalOgrn}
                                                placeholder="1027700132195"
                                            />
                                        </AppField>
                                        <AppField label="Корр. счёт" required>
                                            <TextInput
                                                size="l"
                                                value={legalCorrespondentAccount}
                                                onUpdate={setLegalCorrespondentAccount}
                                                placeholder="30101810400000000225"
                                            />
                                        </AppField>
                                    </>
                                )}
                            </div>
                        )}

                        <Checkbox checked={paymentStatusConsent} onUpdate={setPaymentStatusConsent} size="l">
                            <span style={{ fontSize: 13, color: "var(--g-color-text-secondary)", lineHeight: 1.4 }}>
                                {TUTOR_REPETO_PAYMENT_STATUS_TEXT}
                            </span>
                        </Checkbox>

                        <Checkbox checked={paymentTermsConsent} onUpdate={setPaymentTermsConsent} size="l">
                            <span style={{ fontSize: 13, color: "var(--g-color-text-secondary)", lineHeight: 1.4 }}>
                                {TUTOR_REPETO_PAYMENT_TERMS_TEXT}
                            </span>
                        </Checkbox>

                        {paymentConnectionStatus === "UNAVAILABLE" && (
                            <Text variant="caption-2" color="secondary">
                                {paymentConnectionStatusReason || TUTOR_REPETO_PAYMENT_UNAVAILABLE_TEXT}
                            </Text>
                        )}

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                            <Button view="action" size="l" disabled={saving} onClick={handleConnectYukassa}>
                                {hasYukassa ? "Обновить профиль выплат" : "Сохранить профиль выплат"}
                            </Button>
                            {hasYukassa && (
                                <Button view="outlined" size="l" disabled={saving} onClick={handleDisconnectYukassa}>
                                    Отключить выплаты через Repeto
                                </Button>
                            )}
                        </div>
                    </div>
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
