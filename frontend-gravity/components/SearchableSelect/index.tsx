import { useState, useRef, useEffect, Fragment } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import Icon from "@/components/Icon";

type SearchableSelectProps = {
    label?: string;
    className?: string;
    placeholder?: string;
    items: { id: string; title: string }[];
    value: { id: string; title: string } | null;
    onChange: (val: { id: string; title: string }) => void;
    allowCustom?: boolean;
};

const SearchableSelect = ({
    label,
    className,
    placeholder,
    items,
    value,
    onChange,
    allowCustom,
}: SearchableSelectProps) => {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered =
        query === ""
            ? items
            : items.filter((item) =>
                  item.title.toLowerCase().includes(query.toLowerCase())
              );

    return (
        <div className={`relative ${className}`}>
            {label && <div className="mb-3 text-xs font-bold">{label}</div>}
            <Combobox
                value={value}
                onChange={(val) => {
                    if (val) onChange(val);
                }}
            >
                {({ open }) => (
                    <>
                        <div className="relative">
                            <Combobox.Input
                                ref={inputRef}
                                className={twMerge(
                                    `w-full h-16 px-5 pr-12 bg-white border border-n-1 rounded-sm text-sm text-n-1 font-bold outline-none transition-colors dark:bg-n-1 dark:border-white dark:text-white ${
                                        open
                                            ? "border-purple-1 dark:border-purple-1"
                                            : ""
                                    }`
                                )}
                                placeholder={placeholder}
                                displayValue={(item: any) =>
                                    item?.title || ""
                                }
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-4">
                                <Icon
                                    className={`icon-20 transition-transform dark:fill-white ${
                                        open ? "rotate-180" : ""
                                    }`}
                                    name="arrow-bottom"
                                />
                            </Combobox.Button>
                        </div>
                        <Transition
                            as={Fragment}
                            leave="transition duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setQuery("")}
                        >
                            <Combobox.Options className="absolute left-0 right-0 w-full mt-1 p-2 bg-white border border-n-3 rounded-sm shadow-lg dark:bg-n-1 dark:border-white z-10 max-h-60 overflow-auto">
                                {filtered.length === 0 && query !== "" ? (
                                    allowCustom ? (
                                        <Combobox.Option
                                            className="flex items-center px-3 py-2 rounded-sm text-sm font-bold text-purple-1 cursor-pointer hover:bg-n-3/20"
                                            value={{
                                                id: query.toLowerCase(),
                                                title: query,
                                            }}
                                        >
                                            <Icon
                                                className="mr-2 fill-purple-1"
                                                name="add-circle"
                                            />
                                            Добавить «{query}»
                                        </Combobox.Option>
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-n-3 dark:text-white/50">
                                            Ничего не найдено
                                        </div>
                                    )
                                ) : (
                                    filtered.map((item) => (
                                        <Combobox.Option
                                            key={item.id}
                                            value={item}
                                            className="flex items-start px-3 py-2 rounded-sm text-sm font-bold text-n-3 transition-colors cursor-pointer hover:text-n-1 ui-selected:!bg-n-3/20 ui-selected:!text-n-1 ui-active:bg-n-3/10 ui-active:text-n-1 dark:text-white/50 dark:hover:text-white dark:ui-selected:!text-white dark:ui-active:text-white"
                                        >
                                            {item.title}
                                        </Combobox.Option>
                                    ))
                                )}
                            </Combobox.Options>
                        </Transition>
                    </>
                )}
            </Combobox>
        </div>
    );
};

export default SearchableSelect;
