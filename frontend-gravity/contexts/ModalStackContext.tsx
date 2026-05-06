import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type ModalEntry = {
    id: string;
    onEscape: () => void;
    enabled: boolean;
};

type ModalStackContextValue = {
    registerModal: (id: string, onEscape: () => void, enabled: boolean) => void;
    updateModal: (id: string, onEscape: () => void, enabled: boolean) => void;
    unregisterModal: (id: string) => void;
};

const defaultValue: ModalStackContextValue = {
    registerModal: () => undefined,
    updateModal: () => undefined,
    unregisterModal: () => undefined,
};

const ModalStackContext = createContext<ModalStackContextValue>(defaultValue);

const upsertModal = (
    entries: ModalEntry[],
    id: string,
    onEscape: () => void,
    enabled: boolean,
) => {
    const index = entries.findIndex((entry) => entry.id === id);

    if (index === -1) {
        return [...entries, { id, onEscape, enabled }];
    }

    const current = entries[index];
    const nextEntry: ModalEntry = {
        ...current,
        onEscape,
        enabled,
    };

    if (current.onEscape === onEscape && current.enabled === enabled) {
        return entries;
    }

    if (!current.enabled && enabled) {
        const next = [...entries];
        next.splice(index, 1);
        next.push(nextEntry);
        return next;
    }

    const next = [...entries];
    next[index] = nextEntry;
    return next;
};

export const ModalStackProvider = ({ children }: { children: ReactNode }) => {
    const [entries, setEntries] = useState<ModalEntry[]>([]);
    const entriesRef = useRef(entries);

    useEffect(() => {
        entriesRef.current = entries;
    }, [entries]);

    const registerModal = useCallback((id: string, onEscape: () => void, enabled: boolean) => {
        setEntries((prev) => upsertModal(prev, id, onEscape, enabled));
    }, []);

    const updateModal = useCallback((id: string, onEscape: () => void, enabled: boolean) => {
        setEntries((prev) => upsertModal(prev, id, onEscape, enabled));
    }, []);

    const unregisterModal = useCallback((id: string) => {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;

            const topEntry = [...entriesRef.current].reverse().find((entry) => entry.enabled);
            if (!topEntry) return;

            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") {
                event.stopImmediatePropagation();
            }

            topEntry.onEscape();
        };

        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, []);

    return (
        <ModalStackContext.Provider value={{ registerModal, updateModal, unregisterModal }}>
            {children}
        </ModalStackContext.Provider>
    );
};

export const useModalStack = () => useContext(ModalStackContext);
