import { Button, Text, TextInput } from "@gravity-ui/uikit";
import { Plus, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import FormField from "../FormField";
import SectionCard from "../SectionCard";
import {
    accountAnimatedIconPaths,
    createDraftWorkExperienceId,
    WorkExperienceEntry,
} from "../utils";

type Props = {
    workExperience: WorkExperienceEntry[];
    setWorkExperience: React.Dispatch<React.SetStateAction<WorkExperienceEntry[]>>;
    qualificationVerified: boolean;
};

const QualificationSection = ({ workExperience, setWorkExperience, qualificationVerified }: Props) => (
    <SectionCard
        title="Места работы"
        action={
            <Button
                view="flat"
                size="m"
                className="repeto-settings-add-btn repeto-settings-add-btn--section"
                onClick={() =>
                    setWorkExperience((prev) => [
                        ...prev,
                        {
                            id: createDraftWorkExperienceId(),
                            place: "",
                            role: "",
                            years: "",
                            verified: false,
                            verificationLabel: null,
                        },
                    ])
                }
            >
                <AnimatedSidebarIcon
                    src={accountAnimatedIconPaths.add}
                    fallbackIcon={Plus as IconData}
                    play
                    size={14}
                />
                Добавить
            </Button>
        }
    >
        {workExperience.length === 0 ? (
            <Text variant="body-1" color="secondary" className="repeto-settings-empty-text">
                Добавьте опыт работы построчно: каждая запись попадет в публичный профиль отдельным пунктом.
            </Text>
        ) : (
            <div className="repeto-settings-repeat-list" style={{ marginBottom: 12 }}>
                {workExperience.map((entry, i) => {
                    const badgeText = entry.verified
                        ? entry.verificationLabel || "Подтверждено"
                        : "На проверке";

                    return (
                        <div
                            key={entry.id}
                            className="repeto-settings-account-grid repeto-settings-education-row"
                        >
                            <FormField label="Организация" full>
                                <TextInput
                                    value={entry.place}
                                    onUpdate={(v) => {
                                        const updated = [...workExperience];
                                        updated[i] = { ...updated[i], place: v };
                                        setWorkExperience(updated);
                                    }}
                                    placeholder="Онлайн-школа Пифагор"
                                    size="l"
                                />
                            </FormField>
                            <FormField label="Должность / роль">
                                <TextInput
                                    value={entry.role}
                                    onUpdate={(v) => {
                                        const updated = [...workExperience];
                                        updated[i] = { ...updated[i], role: v };
                                        setWorkExperience(updated);
                                    }}
                                    placeholder="Преподаватель математики"
                                    size="l"
                                />
                            </FormField>
                            <FormField label="Период">
                                <TextInput
                                    value={entry.years}
                                    onUpdate={(v) => {
                                        const updated = [...workExperience];
                                        updated[i] = { ...updated[i], years: v };
                                        setWorkExperience(updated);
                                    }}
                                    placeholder="2021-2024"
                                    size="l"
                                />
                            </FormField>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 2 }}>
                                <span
                                    className={`repeto-settings-verification__badge${entry.verified ? " repeto-settings-verification__badge--ok" : ""}`}
                                    title={badgeText}
                                >
                                    {badgeText}
                                </span>
                                <Button
                                    view="flat-danger"
                                    size="s"
                                    className="repeto-settings-icon-danger-btn"
                                    onClick={() => setWorkExperience((prev) => prev.filter((_, idx) => idx !== i))}
                                    aria-label="Удалить место работы"
                                    title="Удалить место работы"
                                >
                                    <AnimatedSidebarIcon
                                        src={accountAnimatedIconPaths.remove}
                                        fallbackIcon={TrashBin as IconData}
                                        play
                                        size={14}
                                    />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        <div className="repeto-settings-verification">
            <div className="repeto-settings-verification__main">
                <Text variant="body-1" className="repeto-settings-verification__title">Общая верификация</Text>
                <Text variant="caption-2" color="secondary" className="repeto-settings-verification__desc">
                    Проверяем документы и выдаем отметку в профиле.
                </Text>
            </div>
            <span className={`repeto-settings-verification__badge${qualificationVerified ? " repeto-settings-verification__badge--ok" : ""}`}>
                {qualificationVerified ? "Верифицирован" : "На проверке"}
            </span>
        </div>
    </SectionCard>
);

export default QualificationSection;
