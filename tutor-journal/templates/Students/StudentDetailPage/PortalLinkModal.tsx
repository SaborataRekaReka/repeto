import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import { generatePortalLink } from "@/hooks/useStudents";

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
                .catch((err) => setError("Не удалось создать ссылку"))
                .finally(() => setLoading(false));
        }
        if (!visible) {
            setUrl(null);
            setCopied(false);
        }
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
            "_blank"
        );
    };

    return (
        <Modal
            title="Ссылка для ученика"
            visible={visible}
            onClose={onClose}
        >
            <div className="p-5">
                <p className="text-sm text-n-3 dark:text-white/50 mb-4">
                    Отправьте эту ссылку ученику ({studentName}) или
                    родителю. По ней они увидят расписание, домашние задания
                    и баланс.
                </p>

                {loading && (
                    <p className="text-sm text-n-3 mb-4">Генерация ссылки…</p>
                )}
                {error && (
                    <p className="text-sm text-pink-1 mb-4">{error}</p>
                )}
                {url && (
                    <>
                        <div className="p-3 rounded-sm border border-n-1 dark:border-white bg-n-4/30 dark:bg-white/5 mb-4">
                            <p className="text-xs font-mono break-all select-all">
                                {url}
                            </p>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <button
                                className="btn-purple btn-small grow"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <>
                                        <Icon className="icon-16 mr-1" name="check" />
                                        Скопировано!
                                    </>
                                ) : (
                                    "Скопировать"
                                )}
                            </button>
                            <button
                                className="btn-stroke btn-small grow"
                                onClick={handleWhatsApp}
                            >
                                WhatsApp
                            </button>
                        </div>
                    </>
                )}

                <div className="p-3 rounded-sm bg-yellow-2 dark:bg-yellow-1/10">
                    <p className="text-xs text-n-3 dark:text-white/70">
                        Любой, у кого есть ссылка, сможет увидеть данные
                        ученика. Если ссылка скомпрометирована, сбросьте её.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default PortalLinkModal;
