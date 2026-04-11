import { Listbox, Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import Icon from "@/components/Icon";

type SelectProps = {
    label?: string;
    className?: string;
    classButton?: string;
    classArrow?: string;
    classOptions?: string;
    classOption?: string;
    placeholder?: string;
    items: any;
    value: any;
    onChange: any;
    up?: boolean;
    small?: boolean;
};

const Select = ({
    label,
    className,
    classButton,
    classArrow,
    classOptions,
    classOption,
    placeholder,
    items,
    value,
    onChange,
    up,
    small,
}: SelectProps) => (
    <div className={`relative ${className}`}>
        {label && <div className="mb-3 text-xs font-bold">{label}</div>}
        <Listbox value={value} onChange={onChange}>
            {({ open }) => (
                <>
                    <Listbox.Button
                        className={twMerge(
                            `flex items-center w-full h-16 px-5 bg-white border border-n-1 rounded-sm text-sm text-n-1 font-bold outline-none transition-colors tap-highlight-color dark:bg-n-1 dark:border-white dark:text-white ${
                                small ? "h-6 px-4 text-xs" : ""
                            } ${
                                open
                                    ? "border-purple-1 dark:border-purple-1"
                                    : ""
                            } ${classButton}`
                        )}
                    >
                        <span className="mr-auto truncate">
                            {value ? (
                                value.title
                            ) : (
                                <span className="text-n-2 dark:text-white/75">
                                    {placeholder}
                                </span>
                            )}
                        </span>
                        <Icon
                            className={`shrink-0 icon-20 ml-6 -mr-0.5 transition-transform dark:fill-white ${
                                small ? "ml-2 -mr-2" : ""
                            } ${open ? "rotate-180" : ""} ${classArrow}`}
                            name="arrow-bottom"
                        />
                    </Listbox.Button>
                    <Transition
                        leave="transition duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options
                            className={twMerge(
                                `absolute left-0 right-0 w-full mt-1 p-2 bg-white border border-n-3 rounded-sm shadow-lg dark:bg-n-1 dark:border-white ${
                                    small ? "p-0" : ""
                                } ${
                                    up ? "top-auto bottom-full mt-0 mb-1" : ""
                                } ${open ? "z-10" : ""} ${classOptions}`
                            )}
                        >
                            {items.map((item: any) => (
                                <Listbox.Option
                                    className={`flex items-start px-3 py-2 rounded-sm text-sm font-bold text-n-3 transition-colors cursor-pointer hover:text-n-1 ui-selected:!bg-n-3/20 ui-selected:!text-n-1 tap-highlight-color dark:text-white/50 dark:hover:text-white dark:ui-selected:!text-white ${
                                        small ? "!py-1 !pl-4 text-xs" : ""
                                    } ${classOption}`}
                                    key={item.id}
                                    value={item}
                                >
                                    {item.title}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </>
            )}
        </Listbox>
    </div>
);

export default Select;
