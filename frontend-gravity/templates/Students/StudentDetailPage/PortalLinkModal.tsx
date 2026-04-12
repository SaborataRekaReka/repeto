import { useState, useEffect } from "react";
import { Dialog, Button, Icon, Loader, Text } from "@gravity-ui/uikit";
import { Copy } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import { generatePortalLink } from "@/hooks/useStudents";
import { codedErrorMessage } from "@/lib/errorCodes";

type PortalLinkModalProps = {
    visible: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    tutorSlug: string;
};

const PortalLinkModal = ({
    visible,
    onClose,
    studentId,
    studentName,
    tutorSlug,
}: PortalLinkModalProps) => {
    const [copied, setCopied] = useState(false);
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && !url) {
            setLoading(true);
            setError(null);
            generatePortalLink(studentId)
                .then((res) => setUrl(res.portalUrl))
                .catch((e: any) => setError(codedErrorMessage("PORTAL-LINK", e)))
                .finally(() => setLoading(false));
        }
        if (!visible) {
            setUrl(null);
            setCopied(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const handleCopy = async () => {
        if (!url) return;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        if (!url) return;
        const msg = `Привет! Вот ваша ссылка на личный кабинет ученика:\n${url}`;
        window.open(
            `https://wa.me/?text=${encodeURIComponent(msg)}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <Dialog size="s" open={visible} onClose={onClose}>
            <Dialog.Header caption="Ссылка для ученика" />
            <Dialog.Body>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Text variant="body-1" color="secondary">
                        Отправьте эту ссылку ученику ({studentName}) или
                        родителю. По ней они увидят расписание, домашние
                        задания и баланс.
                    </Text>

                    {loading && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                padding: "16px 0",
                            }}
                        >
                            <Loader size="s" />
                        </div>
                    )}
                    {error && (
                        <Text variant="body-2" color="danger">
                            {error}
                        </Text>
                    )}

                    {url && (
                        <>
                            <div
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    border: "1px solid var(--g-color-line-generic)",
                                    background:
                                        "var(--g-color-base-misc-light)",
                                    wordBreak: "break-all",
                                    userSelect: "all",
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                }}
                            >
                                {url}
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <Button
                                    view="action"
                                    size="l"
                                    style={{ flex: 1 }}
                                    onClick={handleCopy}
                                >
                                    <Icon data={Copy as IconData} size={14} />
                                    {copied ? "Скопировано!" : "Скопировать"}
                                </Button>
                                <Button
                                    view="outlined"
                                    size="l"
                                    style={{ flex: 1 }}
                                    onClick={handleWhatsApp}
                                >
                                    WhatsApp
                                </Button>
                            </div>
                        </>
                    )}

                    <div
                        style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: "var(--g-color-base-warning-light)",
                        }}
                    >
                        <Text variant="caption-2" color="secondary">
                            Любой, у кого есть ссылка, сможет увидеть данные
                            ученика. Если ссылка скомпрометирована, сбросьте её.
                        </Text>
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={onClose}
                textButtonCancel="Закрыть"
            />
        </Dialog>
    );
};

export default PortalLinkModal;
