import { useEffect, useRef } from "react";
import { useModalStack } from "@/contexts/ModalStackContext";

type UseModalEscapeOptions = {
    enabled: boolean;
    onEscape: () => void;
};

let modalEscapeIdCounter = 0;

const createModalEscapeId = () => {
    modalEscapeIdCounter += 1;
    return `modal-escape-${modalEscapeIdCounter}`;
};

export const useModalEscape = ({ enabled, onEscape }: UseModalEscapeOptions) => {
    const { registerModal, updateModal, unregisterModal } = useModalStack();
    const idRef = useRef<string>("");
    const onEscapeRef = useRef(onEscape);
    const stableEscapeRef = useRef<() => void>();

    if (!idRef.current) {
        idRef.current = createModalEscapeId();
    }

    if (!stableEscapeRef.current) {
        stableEscapeRef.current = () => {
            onEscapeRef.current();
        };
    }

    useEffect(() => {
        onEscapeRef.current = onEscape;
    }, [onEscape]);

    useEffect(() => {
        const modalId = idRef.current;
        registerModal(modalId, stableEscapeRef.current as () => void, enabled);

        return () => {
            unregisterModal(modalId);
        };
    }, [enabled, registerModal, unregisterModal]);

    useEffect(() => {
        updateModal(idRef.current, stableEscapeRef.current as () => void, enabled);
    }, [enabled, updateModal]);
};
