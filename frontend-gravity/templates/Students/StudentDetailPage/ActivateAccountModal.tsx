import { useState } from "react";
import { Button, Text } from "@gravity-ui/uikit";
import AppDialog from "@/components/AppDialog";
import { activateStudentAccount } from "@/hooks/useStudents";
import { codedErrorMessage } from "@/lib/errorCodes";

type ActivateAccountModalProps = {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    studentId: string;
    studentName: string;
    studentEmail?: string;
    hasAccount?: boolean;
};

const ActivateAccountModal = ({
    visible,
    onClose,
    onSuccess,
    studentId,
    studentName,
    studentEmail,
    hasAccount,
}: ActivateAccountModalProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ email: string; invited: boolean } | null>(null);

    const handleActivate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await activateStudentAccount(studentId);
            setResult({ email: res.email, invited: res.invited });
            onSuccess?.();
        } catch (e: any) {
            setError(codedErrorMessage("ACTIVATE-ACCOUNT", e));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setResult(null);
        setError(null);
        onClose();
    };

    const hasEmail = !!studentEmail && studentEmail.includes("@");

    return (
        <AppDialog
            size="s"
            open={visible}
            onClose={handleClose}
            caption="Личный кабинет ученика"
            footer={{
                onClickButtonCancel: handleClose,
                textButtonCancel: result ? "Готово" : "Отмена",
            }}
        >
            {!result && (
                <>
                    <Text variant="body-1" color="secondary">
                        {hasAccount
                            ? `У ${studentName} уже есть личный кабинет. Отправить новую ссылку на вход?`
                            : `Отправим ${studentName} приглашение в Repeto. На почту придёт письмо со ссылкой на вход по одноразовому коду.`}
                    </Text>

                    {!hasEmail && (
                        <div
                            style={{
                                padding: "10px 14px",
                                borderRadius: 8,
                                background: "var(--g-color-base-warning-light)",
                                marginTop: 12,
                            }}
                        >
                            <Text variant="caption-2" color="secondary">
                                У ученика не указан email — добавьте его в карточке, чтобы создать кабинет.
                            </Text>
                        </div>
                    )}

                    {hasEmail && (
                        <Text variant="body-2" style={{ marginTop: 12 }}>
                            Email для входа: <b>{studentEmail}</b>
                        </Text>
                    )}

                    {error && (
                        <Text variant="body-2" color="danger" style={{ marginTop: 12 }}>
                            {error}
                        </Text>
                    )}

                    <div className="repeto-dialog-row" style={{ gap: 8, marginTop: 16 }}>
                        <Button
                            view="action"
                            size="l"
                            style={{ flex: 1 }}
                            onClick={handleActivate}
                            loading={loading}
                            disabled={!hasEmail || loading}
                        >
                            {hasAccount ? "Отправить новое письмо" : "Отправить приглашение"}
                        </Button>
                    </div>
                </>
            )}

            {result && (
                <>
                    <Text variant="body-1">
                        {result.invited
                            ? "Приглашение отправлено."
                            : "Письмо со ссылкой на вход отправлено повторно."}
                    </Text>
                    <Text variant="body-2" color="secondary" style={{ marginTop: 8 }}>
                        Ссылка на вход отправлена на <b>{result.email}</b>. Кабинет
                        будет создан автоматически, когда ученик откроет ссылку и подтвердит email.
                    </Text>
                </>
            )}
        </AppDialog>
    );
};

export default ActivateAccountModal;
