import { TextInput, TextArea, Text } from "@gravity-ui/uikit";
import PhoneInput from "@/components/PhoneInput";
import FormField from "../FormField";
import SectionCard from "../SectionCard";
import { summarizePaymentRequisites } from "../utils";

type Props = {
    paymentCardNumber: string; setPaymentCardNumber: (v: string) => void;
    paymentSbpPhone: string; setPaymentSbpPhone: (v: string) => void;
    paymentRequisites: string; setPaymentRequisites: (v: string) => void;
};

const PaymentSection = ({
    paymentCardNumber, setPaymentCardNumber,
    paymentSbpPhone, setPaymentSbpPhone,
    paymentRequisites, setPaymentRequisites,
}: Props) => {
    const preview = summarizePaymentRequisites(paymentRequisites);
    return (
        <SectionCard title="Оплата">
            <div className="repeto-settings-account-grid">
                <FormField label="Номер карты" full>
                    <TextInput
                        value={paymentCardNumber}
                        onUpdate={setPaymentCardNumber}
                        placeholder="2200 1234 5678 9567"
                        size="l"
                    />
                </FormField>

                <FormField label="Номер телефона для СБП" full>
                    <PhoneInput
                        value={paymentSbpPhone}
                        onUpdate={setPaymentSbpPhone}
                    />
                </FormField>

                <FormField label="Реквизиты для учеников" full>
                    <TextArea
                        value={paymentRequisites}
                        onUpdate={setPaymentRequisites}
                        placeholder={"СБП: +7 999 123-45-67\nКарта: 2200 1234 5678 9567\nПолучатель: Иванов Иван Иванович"}
                        rows={5}
                        size="l"
                    />
                    <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 6 }}>
                        Видно ученику в портале. Если поле пустое, кнопка не показывается.
                    </Text>
                    {preview && (
                        <Text variant="caption-2" style={{ display: "block", marginTop: 6, color: "var(--g-color-text-brand)" }}>
                            Короткая подпись в портале: {preview}
                        </Text>
                    )}
                </FormField>
            </div>
        </SectionCard>
    );
};

export default PaymentSection;
