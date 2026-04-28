import { Button, Text, TextInput } from "@gravity-ui/uikit";
import { Plus, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import FormField from "../FormField";
import SectionCard from "../SectionCard";
import { accountAnimatedIconPaths, createDraftEducationId, EducationEntry } from "../utils";

type Props = {
    education: EducationEntry[];
    setEducation: React.Dispatch<React.SetStateAction<EducationEntry[]>>;
};

const EducationSection = ({ education, setEducation }: Props) => (
    <SectionCard
        title="Образование"
        action={
            <Button
                view="outlined"
                size="s"
                onClick={() => setEducation((prev) => [...prev, { id: createDraftEducationId(), institution: "", program: "", years: "" }])}
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
        {education.length === 0 ? (
            <Text variant="body-1" color="secondary" className="repeto-settings-empty-text">
                Образование появится на публичной странице.
            </Text>
        ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {education.map((edu, i) => (
                    <div
                        key={edu.id}
                        className="repeto-settings-account-grid"
                        style={{
                            position: "relative",
                            paddingBottom: 8,
                            borderBottom: i < education.length - 1 ? "1px solid var(--g-color-line-generic)" : "none",
                        }}
                    >
                        <FormField label="Учебное заведение" full>
                            <TextInput
                                value={edu.institution}
                                onUpdate={(v) => { const u = [...education]; u[i] = { ...u[i], institution: v }; setEducation(u); }}
                                placeholder="МГУ им. М.В. Ломоносова"
                                size="l"
                            />
                        </FormField>
                        <FormField label="Специальность / программа">
                            <TextInput
                                value={edu.program}
                                onUpdate={(v) => { const u = [...education]; u[i] = { ...u[i], program: v }; setEducation(u); }}
                                placeholder="Филология"
                                size="l"
                            />
                        </FormField>
                        <FormField label="Годы обучения">
                            <TextInput
                                value={edu.years}
                                onUpdate={(v) => { const u = [...education]; u[i] = { ...u[i], years: v }; setEducation(u); }}
                                placeholder="2015–2020"
                                size="l"
                            />
                        </FormField>
                        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                            <Button
                                view="flat-danger"
                                size="s"
                                onClick={() => setEducation((prev) => prev.filter((_, idx) => idx !== i))}
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
                ))}
            </div>
        )}
    </SectionCard>
);

export default EducationSection;
