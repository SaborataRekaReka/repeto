import { Text, TextArea } from "@gravity-ui/uikit";
import FormField from "../FormField";
import SectionCard from "../SectionCard";

type Props = {
    experience: string; setExperience: (v: string) => void;
    qualificationVerified: boolean;
};

const QualificationSection = ({ experience, setExperience, qualificationVerified }: Props) => (
    <SectionCard title="Квалификация">
        <div className="repeto-settings-account-grid">
            <FormField label="Опыт преподавания" full>
                <TextArea value={experience} onUpdate={setExperience} placeholder="Стаж, методика, результаты" rows={3} size="l" />
            </FormField>
            <div className="repeto-settings-verification">
                <div className="repeto-settings-verification__main">
                    <Text variant="body-1" className="repeto-settings-verification__title">Верификация</Text>
                    <Text variant="caption-2" color="secondary" className="repeto-settings-verification__desc">
                        Проверяем документы и выдаем отметку в профиле.
                    </Text>
                </div>
                <span className={`repeto-settings-verification__badge${qualificationVerified ? " repeto-settings-verification__badge--ok" : ""}`}>
                    {qualificationVerified ? "Верифицирован" : "На проверке"}
                </span>
            </div>
        </div>
    </SectionCard>
);

export default QualificationSection;
