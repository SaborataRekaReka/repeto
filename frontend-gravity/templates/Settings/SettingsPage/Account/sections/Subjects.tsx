import { Alert, Button, Icon, Text, TextInput } from "@gravity-ui/uikit";
import { Plus } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import FormField from "../FormField";
import SectionCard from "../SectionCard";
import { accountAnimatedIconPaths, SubjectDraft } from "../utils";

type Props = {
    subjects: SubjectDraft[];
    savedSubjectFlags: boolean[];
    pendingDeleteSubjectIndex: number | null;
    saving: boolean;
    onAdd: () => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, field: "name" | "price" | "duration", v: string) => void;
    onRequestDelete: (i: number) => void;
    onCancelDelete: () => void;
};

const SubjectsSection = ({
    subjects, savedSubjectFlags, pendingDeleteSubjectIndex, saving,
    onAdd, onRemove, onUpdate, onRequestDelete, onCancelDelete,
}: Props) => (
    <SectionCard
        title="Предметы"
        action={
            <Button view="outlined" size="m" onClick={onAdd} className="repeto-settings-add-btn">
                <Icon data={Plus as IconData} size={16} />
                Добавить предмет
            </Button>
        }
    >
        {subjects.length === 0 ? (
            <div className="repeto-settings-empty">
                <div className="repeto-settings-empty__icon">
                    <AnimatedSidebarIcon
                        src={accountAnimatedIconPaths.add}
                        fallbackIcon={Plus as IconData}
                        play
                        size={24}
                    />
                </div>
                <Text variant="body-1" color="secondary">Добавьте предметы</Text>
                <div style={{ marginTop: 12 }}>
                    <Button view="action" size="s" onClick={onAdd}>Добавить</Button>
                </div>
            </div>
        ) : (
            <div className="repeto-subjects-list">
                {subjects.map((subj, i) => {
                    const isSavedSubject = Boolean(savedSubjectFlags[i]);
                    const showDeleteConfirm = isSavedSubject && pendingDeleteSubjectIndex === i;

                    return (
                        <div key={`subject-${i}`} className="repeto-subject-row">
                            <div className="repeto-subject-row__fields">
                                <FormField label="Предмет" className="repeto-subject-row__name">
                                    <TextInput
                                        value={subj.name}
                                        onUpdate={(v) => onUpdate(i, "name", v)}
                                        placeholder="Математика"
                                        size="m"
                                    />
                                </FormField>

                                <FormField label="Цена" className="repeto-subject-row__price">
                                    <TextInput
                                        value={subj.price}
                                        onUpdate={(v) => onUpdate(i, "price", v)}
                                        placeholder="2 100"
                                        size="m"
                                        endContent={<span className="repeto-subject-row__unit">₽</span>}
                                    />
                                </FormField>

                                <FormField label="Длительность" className="repeto-subject-row__duration">
                                    <TextInput
                                        value={subj.duration}
                                        onUpdate={(v) => onUpdate(i, "duration", v)}
                                        placeholder="60"
                                        size="m"
                                        endContent={<span className="repeto-subject-row__unit">мин</span>}
                                    />
                                </FormField>

                                <div className="repeto-subject-row__actions">
                                    <Button
                                        view="flat-danger"
                                        size="m"
                                        onClick={() => {
                                            if (!isSavedSubject) {
                                                onRemove(i);
                                                return;
                                            }
                                            onRequestDelete(i);
                                        }}
                                        disabled={saving}
                                        title="Удалить предмет"
                                    >
                                        Удалить
                                    </Button>
                                </div>
                            </div>

                            {showDeleteConfirm && (
                                <Alert
                                    theme="danger"
                                    view="filled"
                                    corners="rounded"
                                    title="Удалить предмет?"
                                    message={
                                        <div className="repeto-subject-row__confirm">
                                            <Text variant="body-2">Это действие нельзя отменить.</Text>
                                            <div className="repeto-subject-row__confirm-actions">
                                                <Button view="outlined-danger" size="s" onClick={() => onRemove(i)}>
                                                    Удалить
                                                </Button>
                                                <Button view="outlined" size="s" onClick={onCancelDelete}>
                                                    Отмена
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </SectionCard>
);

export default SubjectsSection;
