import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import { Persons } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

export const financeSectionNav = [
    { key: "overview", label: "Обзор" },
    { key: "payments", label: "Оплаты" },
];

type FinanceSidebarToolsProps = {
    onOpenDebtors: () => void;
};

const FinanceSidebarTools = ({ onOpenDebtors }: FinanceSidebarToolsProps) => {
    return (
        <div className="repeto-context-sidebar__list repeto-finance-sidebar-tools">
            <button
                type="button"
                className="repeto-context-sidebar__item"
                onClick={onOpenDebtors}
            >
                <span className="repeto-context-sidebar__item-icon">
                    <AnimatedSidebarIcon
                        src="/icons/sidebar-animated/people.json"
                        fallbackIcon={Persons as IconData}
                        play
                        size={22}
                    />
                </span>
                <span className="repeto-context-sidebar__item-text">Найти должников</span>
            </button>
        </div>
    );
};

export default FinanceSidebarTools;
