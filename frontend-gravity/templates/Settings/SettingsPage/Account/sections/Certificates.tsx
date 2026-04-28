import { Button, Text } from "@gravity-ui/uikit";
import { FileArrowUp, TrashBin } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import AnimatedSidebarIcon from "@/components/AnimatedSidebarIcon";
import SectionCard from "../SectionCard";
import { accountAnimatedIconPaths, CertificateEntry, isPdfUrl } from "../utils";
import { resolveApiAssetUrl } from "@/lib/api";

type Props = {
    certificates: CertificateEntry[];
    certUploading: boolean;
    certInputRef: React.RefObject<HTMLInputElement>;
    onUploadFile: (file: File) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
};

const CertificatesSection = ({ certificates, certUploading, certInputRef, onUploadFile, onDelete }: Props) => (
    <SectionCard
        title="Документы"
        action={
            <>
                <Button view="outlined" size="s" onClick={() => certInputRef.current?.click()} disabled={certUploading}>
                    <AnimatedSidebarIcon
                        src={accountAnimatedIconPaths.upload}
                        fallbackIcon={FileArrowUp as IconData}
                        play
                        size={14}
                    />
                    {certUploading ? "Загрузка..." : "Загрузить"}
                </Button>
                <input
                    ref={certInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await onUploadFile(file);
                    }}
                />
            </>
        }
    >
        {certificates.length === 0 ? (
            <Text variant="body-1" color="secondary" className="repeto-settings-empty-text">
                Сертификаты и дипломы будут видны после проверки.
            </Text>
        ) : (
            <div className="repeto-settings-certs-grid">
                {certificates.map((cert) => (
                    <div key={cert.id} className="repeto-settings-cert-card">
                        <div className="repeto-settings-cert-card__preview">
                            {isPdfUrl(cert.fileUrl) ? (
                                <div className="repeto-settings-cert-card__pdf">PDF</div>
                            ) : (
                                <img
                                    src={resolveApiAssetUrl(cert.fileUrl) || cert.fileUrl}
                                    alt={cert.title}
                                />
                            )}
                        </div>
                        <div className="repeto-settings-cert-card__info">
                            <Text variant="caption-2" ellipsis title={cert.title}>{cert.title}</Text>
                            <Button
                                view="flat-danger"
                                size="xs"
                                onClick={() => onDelete(cert.id)}
                            >
                                <AnimatedSidebarIcon
                                    src={accountAnimatedIconPaths.remove}
                                    fallbackIcon={TrashBin as IconData}
                                    play
                                    size={12}
                                />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </SectionCard>
);

export default CertificatesSection;
