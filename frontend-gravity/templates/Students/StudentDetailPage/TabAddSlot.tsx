import { Icon } from "@gravity-ui/uikit";
import { CirclePlus } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

type TabAddSlotProps = {
    title: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
};

const TabAddSlot = ({
    title,
    onClick,
    disabled,
    className,
}: TabAddSlotProps) => (
    <button
        type="button"
        className={["tab-add-slot", className || ""].filter(Boolean).join(" ")}
        onClick={onClick}
        disabled={disabled}
    >
        <span className="tab-add-slot__icon" aria-hidden="true">
            <Icon data={CirclePlus as IconData} size={20} />
        </span>
        <span className="tab-add-slot__title">{title}</span>
    </button>
);

export default TabAddSlot;