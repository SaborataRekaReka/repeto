import { useState, useRef, useEffect } from "react";
import Icon from "@/components/Icon";

type MenuItem = {
    label: string;
    icon?: string;
    onClick: () => void;
    danger?: boolean;
};

type DropdownMenuProps = {
    items: MenuItem[];
    className?: string;
};

const DropdownMenu = ({ items, className }: DropdownMenuProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                className="btn-transparent-dark btn-small btn-square"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(!open);
                }}
            >
                <Icon name="dots" />
            </button>
            {open && (
                <div className="absolute right-0 top-full z-20 mt-1 w-56 py-1 bg-white border border-n-1 rounded-sm shadow-lg overflow-hidden dark:bg-n-1 dark:border-white">
                    {items.map((item, index) => (
                        <button
                            className={`flex items-center w-full px-4 py-2 text-sm font-medium text-left transition-colors hover:bg-background dark:hover:bg-white/10 ${
                                item.danger
                                    ? "text-pink-1"
                                    : "text-n-1 dark:text-white"
                            }`}
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.onClick();
                                setOpen(false);
                            }}
                        >
                            {item.icon && (
                                <Icon
                                    className={`icon-18 shrink-0 mr-2 ${
                                        item.danger
                                            ? "fill-pink-1"
                                            : "dark:fill-white"
                                    }`}
                                    name={item.icon}
                                />
                            )}
                            <span className="truncate">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;
