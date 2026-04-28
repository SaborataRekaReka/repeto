import { useState, useEffect } from "react";
import { Card, Text, Button, Switch } from "@gravity-ui/uikit";
import { useSettings, updatePolicies } from "@/hooks/useSettings";
import { codedErrorMessage } from "@/lib/errorCodes";
import AppSelect from "@/components/AppSelect";

const cancelHours = [
    { value: "2", content: "2 часа" }, { value: "4", content: "4 часа" },
    { value: "8", content: "8 часов" }, { value: "12", content: "12 часов" }, { value: "24", content: "24 часа" },
];
const cancelActions = [
    { value: "full", content: "100% оплаты" },
    { value: "half", content: "50% оплаты" },
    { value: "none", content: "Без штрафа" },
];
const paymentMethods = [
    { value: "sbp", content: "СБП" }, { value: "cash", content: "Наличные" },
    { value: "transfer", content: "Перевод на карту" },
];

const DEFAULTS = { cancelTimeHours: "12", lateCancelAction: "full", noShowAction: "full", defaultPaymentMethod: "sbp", isSelfEmployed: false, receiptReminder: false };

const Policies = () => {
    const { data: settings, mutate } = useSettings();
    const [cancelTime, setCancelTime] = useState("12");
    const [lateCancel, setLateCancel] = useState("full");
    const [noShow, setNoShow] = useState("full");
    const [defaultMethod, setDefaultMethod] = useState("sbp");
    const [isSelfEmployed, setIsSelfEmployed] = useState(false);
    const [receiptReminder, setReceiptReminder] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    useEffect(() => {
        const ps = settings?.cancelPolicySettings as any;
        if (!ps) return;
        setCancelTime(ps.cancelTimeHours || DEFAULTS.cancelTimeHours);
        setLateCancel(ps.lateCancelAction || DEFAULTS.lateCancelAction);
        setNoShow(ps.noShowAction || DEFAULTS.noShowAction);
        setDefaultMethod(ps.defaultPaymentMethod || DEFAULTS.defaultPaymentMethod);
        setIsSelfEmployed(ps.isSelfEmployed ?? false);
        setReceiptReminder(ps.receiptReminder ?? false);
    }, [settings?.cancelPolicySettings]);

    const handleSave = async () => {
        setSaving(true); setSaveMsg(null);
        try {
            await updatePolicies({ cancelTimeHours: cancelTime, lateCancelAction: lateCancel, noShowAction: noShow, defaultPaymentMethod: defaultMethod, isSelfEmployed, receiptReminder });
            await mutate();
            setSaveMsg("Сохранено");
        } catch (e: any) { setSaveMsg(codedErrorMessage("SETT-POL-SAVE", e)); }
        finally { setSaving(false); }
    };
    const handleReset = () => {
        setCancelTime(DEFAULTS.cancelTimeHours); setLateCancel(DEFAULTS.lateCancelAction);
        setNoShow(DEFAULTS.noShowAction); setDefaultMethod(DEFAULTS.defaultPaymentMethod);
        setIsSelfEmployed(DEFAULTS.isSelfEmployed); setReceiptReminder(DEFAULTS.receiptReminder); setSaveMsg(null);
    };

    return (
        <div className="repeto-settings-stack">
            {/* Cancel policy */}
            <Card className="repeto-settings-section-card" view="outlined">
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Отмены</Text>
                </div>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                    <AppSelect
                        label="Бесплатная отмена до занятия"
                        options={cancelHours}
                        value={[cancelTime]}
                        onUpdate={(v) => setCancelTime(v[0])}
                        size="l"
                        width="max"
                    />
                    <AppSelect
                        label="Поздняя отмена"
                        options={cancelActions}
                        value={[lateCancel]}
                        onUpdate={(v) => setLateCancel(v[0])}
                        size="l"
                        width="max"
                    />
                    <AppSelect
                        label="Неявка ученика"
                        options={cancelActions}
                        value={[noShow]}
                        onUpdate={(v) => setNoShow(v[0])}
                        size="l"
                        width="max"
                    />
                </div>
            </Card>

            {/* Payment defaults */}
            <Card className="repeto-settings-section-card" view="outlined">
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Оплата</Text>
                </div>
                <div style={{ padding: 24 }}>
                    <AppSelect
                        label="Способ оплаты по умолчанию"
                        options={paymentMethods}
                        value={[defaultMethod]}
                        onUpdate={(v) => setDefaultMethod(v[0])}
                        size="l"
                        width="max"
                    />
                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 12 }}>Валюта: ₽ (Российский рубль)</Text>
                </div>
            </Card>

            {/* Self-employed */}
            <Card className="repeto-settings-section-card" view="outlined">
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--g-color-line-generic)" }}>
                    <Text variant="subheader-2">Чеки</Text>
                </div>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="repeto-settings-switch-row">
                        <div>
                            <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>Я — самозанятый</Text>
                            <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>Для формирования чеков через «Мой налог»</Text>
                        </div>
                        <Switch checked={isSelfEmployed} onUpdate={setIsSelfEmployed} size="l" />
                    </div>
                    {isSelfEmployed && (
                        <div className="repeto-settings-switch-row">
                            <div>
                                <Text variant="body-1" style={{ fontWeight: 600, display: "block" }}>Напоминать о формировании чека</Text>
                                <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>При каждой полученной оплате</Text>
                            </div>
                            <Switch checked={receiptReminder} onUpdate={setReceiptReminder} size="l" />
                        </div>
                    )}
                </div>
            </Card>

            {/* Buttons */}
            <div className="repeto-settings-actions-row">
                <Button view="outlined" size="l" onClick={handleReset}>Сбросить</Button>
                <div className="repeto-settings-savebar">
                    {saveMsg && (
                        <Text variant="body-1" className={`repeto-settings-savebar__message${saveMsg === "Сохранено" ? " repeto-settings-savebar__message--ok" : " repeto-settings-savebar__message--error"}`}>{saveMsg}</Text>
                    )}
                    <Button view="action" size="l" onClick={handleSave} disabled={saving}>
                        {saving ? "Сохраняем..." : "Сохранить"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Policies;
