import { useState, useEffect } from "react";
import Select from "@/components/Select";
import Switch from "@/components/Switch";
import { useSettings, updatePolicies } from "@/hooks/useSettings";

const cancelHours = [
    { id: "2", title: "2 часа" },
    { id: "4", title: "4 часа" },
    { id: "8", title: "8 часов" },
    { id: "12", title: "12 часов" },
    { id: "24", title: "24 часа" },
];

const cancelActions = [
    { id: "full", title: "Полная оплата" },
    { id: "half", title: "50% оплаты" },
    { id: "none", title: "Без штрафа" },
];

const paymentMethods = [
    { id: "sbp", title: "СБП" },
    { id: "cash", title: "Наличные" },
    { id: "transfer", title: "Перевод на карту" },
];

const DEFAULTS = {
    cancelTimeHours: "12",
    lateCancelAction: "full",
    noShowAction: "full",
    defaultPaymentMethod: "sbp",
    isSelfEmployed: false,
    receiptReminder: false,
};

const Policies = () => {
    const { data: settings, mutate } = useSettings();
    const [cancelTime, setCancelTime] = useState<any>(cancelHours[3]);
    const [lateCancel, setLateCancel] = useState<any>(cancelActions[0]);
    const [noShow, setNoShow] = useState<any>(cancelActions[0]);
    const [defaultMethod, setDefaultMethod] = useState<any>(paymentMethods[0]);
    const [isSelfEmployed, setIsSelfEmployed] = useState(false);
    const [receiptReminder, setReceiptReminder] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    // Load from server
    useEffect(() => {
        const ps = settings?.cancelPolicySettings as any;
        if (!ps) return;
        setCancelTime(cancelHours.find((h) => h.id === ps.cancelTimeHours) || cancelHours[3]);
        setLateCancel(cancelActions.find((a) => a.id === ps.lateCancelAction) || cancelActions[0]);
        setNoShow(cancelActions.find((a) => a.id === ps.noShowAction) || cancelActions[0]);
        setDefaultMethod(paymentMethods.find((m) => m.id === ps.defaultPaymentMethod) || paymentMethods[0]);
        setIsSelfEmployed(ps.isSelfEmployed ?? false);
        setReceiptReminder(ps.receiptReminder ?? false);
    }, [settings?.cancelPolicySettings]);

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            await updatePolicies({
                cancelTimeHours: cancelTime?.id,
                lateCancelAction: lateCancel?.id,
                noShowAction: noShow?.id,
                defaultPaymentMethod: defaultMethod?.id,
                isSelfEmployed,
                receiptReminder,
            });
            await mutate();
            setSaveMsg("Сохранено");
        } catch (e: any) {
            setSaveMsg(e?.message || "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setCancelTime(cancelHours.find((h) => h.id === DEFAULTS.cancelTimeHours)!);
        setLateCancel(cancelActions.find((a) => a.id === DEFAULTS.lateCancelAction)!);
        setNoShow(cancelActions.find((a) => a.id === DEFAULTS.noShowAction)!);
        setDefaultMethod(paymentMethods.find((m) => m.id === DEFAULTS.defaultPaymentMethod)!);
        setIsSelfEmployed(DEFAULTS.isSelfEmployed);
        setReceiptReminder(DEFAULTS.receiptReminder);
        setSaveMsg(null);
    };

    return (
        <div className="space-y-6">
            <div className="card">
                <div className="card-title">Политика отмен</div>
                <div className="p-5">
                    <div className="space-y-5">
                        <div>
                            <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                                Минимальное время для бесплатной отмены
                            </div>
                            <Select
                                className="max-w-[15rem]"
                                items={cancelHours}
                                value={cancelTime}
                                onChange={setCancelTime}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                                Действие при поздней отмене
                            </div>
                            <Select
                                className="max-w-[15rem]"
                                items={cancelActions}
                                value={lateCancel}
                                onChange={setLateCancel}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                                Действие при неявке (no-show)
                            </div>
                            <Select
                                className="max-w-[15rem]"
                                items={cancelActions}
                                value={noShow}
                                onChange={setNoShow}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-title">Оплата по умолчанию</div>
                <div className="p-5">
                    <div>
                        <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                            Способ оплаты по умолчанию
                        </div>
                        <Select
                            className="max-w-[15rem]"
                            items={paymentMethods}
                            value={defaultMethod}
                            onChange={setDefaultMethod}
                        />
                    </div>
                    <div className="mt-4 text-sm text-n-3 dark:text-white/50">
                        Валюта: ₽ (Российский рубль)
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-title">Статус чека (НПД)</div>
                <div className="p-5">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-bold">
                                    Я — самозанятый
                                </div>
                                <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                    Для формирования чеков через «Мой налог»
                                </div>
                            </div>
                            <Switch
                                value={isSelfEmployed}
                                setValue={() =>
                                    setIsSelfEmployed(!isSelfEmployed)
                                }
                            />
                        </div>
                        {isSelfEmployed && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold">
                                        Напоминать о формировании чека
                                    </div>
                                    <div className="mt-1 text-xs text-n-3 dark:text-white/50">
                                        При каждой полученной оплате
                                    </div>
                                </div>
                                <Switch
                                    value={receiptReminder}
                                    setValue={() =>
                                        setReceiptReminder(!receiptReminder)
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-between md:block">
                <button
                    className="btn-stroke min-w-[11.7rem] md:w-full md:mb-3"
                    onClick={handleReset}
                >
                    Сбросить
                </button>
                <div className="flex items-center gap-3">
                    {saveMsg && (
                        <span className={`text-xs font-bold ${saveMsg === "Сохранено" ? "text-green-1" : "text-pink-1"}`}>
                            {saveMsg}
                        </span>
                    )}
                    <button
                        className="btn-purple min-w-[11.7rem] md:w-full"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Сохраняем..." : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Policies;
