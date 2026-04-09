import { useState, useRef, useEffect } from "react";
import Icon from "@/components/Icon";

type CardChartProps = {
    className?: string;
    title: string;
    legend?: any;
    children: React.ReactNode;
    months?: string[];
    selectedMonth?: string;
    onMonthChange?: (month: string) => void;
};

const CardChart = ({
    className,
    title,
    legend,
    children,
    months,
    selectedMonth,
    onMonthChange,
}: CardChartProps) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div className={`card ${className}`}>
            <div className="card-head justify-stretch">
                <div className="mr-auto text-h6">{title}</div>
                {legend && (
                    <div className="flex items-center mr-6 md:flex-col md:items-stretch">
                        {legend.map((item: any, index: number) => (
                            <div
                                className="flex items-center mr-6 last:mr-0 text-xs font-bold md:mr-0"
                                key={index}
                            >
                                <div
                                    className="w-2 h-2 mr-1.5 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                {item.title}
                            </div>
                        ))}
                    </div>
                )}
                <div className="relative flex items-center" ref={dropdownRef}>
                    {selectedMonth && (
                        <span className="mr-2 text-xs font-bold text-n-3 dark:text-white/50">
                            {selectedMonth}
                        </span>
                    )}
                    <button
                        className="group inline-flex items-center justify-center text-0 leading-none"
                        onClick={() => {
                            if (months && months.length > 0) setOpen(!open);
                        }}
                    >
                        <Icon
                            className="icon-18 fill-n-1 transition-colors dark:fill-white group-hover:fill-purple-1"
                            name="calendar"
                        />
                    </button>
                    {open && months && (
                        <div className="absolute right-0 top-full mt-1 z-10 min-w-[10rem] bg-white border border-n-1 rounded-sm shadow-lg dark:bg-n-1 dark:border-white">
                            {months.map((m) => (
                                <button
                                    key={m}
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-n-4/50 dark:hover:bg-white/10 transition-colors ${
                                        m === selectedMonth
                                            ? "font-bold text-purple-1"
                                            : ""
                                    }`}
                                    onClick={() => {
                                        onMonthChange?.(m);
                                        setOpen(false);
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
};

export default CardChart;
