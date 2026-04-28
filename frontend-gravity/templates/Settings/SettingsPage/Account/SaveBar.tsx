import { Button, Text } from "@gravity-ui/uikit";

type Props = {
    saving: boolean;
    saveMsg: string | null;
    onSave: () => void;
};

const SaveBar = ({ saving, saveMsg, onSave }: Props) => (
    <div className="repeto-settings-savebar repeto-settings-savebar--sticky">
        {saveMsg && (
            <Text
                variant="body-1"
                className={`repeto-settings-savebar__message${saveMsg === "Сохранено" ? " repeto-settings-savebar__message--ok" : " repeto-settings-savebar__message--error"}`}
            >
                {saveMsg}
            </Text>
        )}
        <Button view="action" size="l" onClick={onSave} disabled={saving}>
            {saving ? "Сохраняем..." : "Сохранить"}
        </Button>
    </div>
);

export default SaveBar;
