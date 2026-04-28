import { Button, Icon } from "@gravity-ui/uikit";
import { CircleQuestion } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import SectionCard from "../SectionCard";
import { getInitials } from "@/lib/formatters";

type Props = {
    avatarSrc: string | null;
    userName: string | undefined;
    avatarInputRef: React.RefObject<HTMLInputElement>;
    onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const PortraitSection = ({ avatarSrc, userName, avatarInputRef, onAvatarChange }: Props) => (
    <SectionCard
        title="Ваш портрет"
        className="repeto-settings-portrait-section"
        titleSlot={<div className="repeto-settings-portrait-title">Ваш портрет</div>}
    >
        <div className="repeto-settings-portrait-row">
            <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="repeto-settings-avatar-trigger repeto-settings-avatar-trigger--account"
                aria-label="Изменить портрет"
            >
                {avatarSrc ? (
                    <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div className="repeto-settings-avatar-fallback">{getInitials(userName || "")}</div>
                )}
            </button>
            <Button
                view="flat"
                size="l"
                className="repeto-settings-portrait-button"
                onClick={() => avatarInputRef.current?.click()}
            >
                Изменить
            </Button>
            <button
                type="button"
                className="repeto-settings-portrait-help"
                aria-label="Требования к портрету"
                title="Портрет отображается на публичной странице и в профиле ученика"
            >
                <Icon data={CircleQuestion as IconData} size={22} />
            </button>
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onAvatarChange}
            />
        </div>
    </SectionCard>
);

export default PortraitSection;
