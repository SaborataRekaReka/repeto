import { TextInput } from "@gravity-ui/uikit";
import AppSelect from "@/components/AppSelect";
import FormField from "../FormField";
import SectionCard from "../SectionCard";
import { formatOptions } from "../utils";

type Props = {
    format: string; setFormat: (v: string) => void;
    offlineAddress: string; setOfflineAddress: (v: string) => void;
};

const FormatSection = ({ format, setFormat, offlineAddress, setOfflineAddress }: Props) => (
    <SectionCard title="Формат" bodyClassName="repeto-settings-format-grid">
        <AppSelect
            label="Формат"
            options={formatOptions}
            value={[format]}
            onUpdate={(v) => setFormat(v[0])}
            size="l"
            width="max"
        />
        {(format === "offline" || format === "both") && (
            <FormField label="Адрес (очно)">
                <TextInput value={offlineAddress} onUpdate={setOfflineAddress} placeholder="Москва, м. Тверская" size="l" />
            </FormField>
        )}
    </SectionCard>
);

export default FormatSection;
