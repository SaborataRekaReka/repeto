import Link from "next/link";
import { Card, Text, Label, Loader } from "@gravity-ui/uikit";
import { useExpiringPackages } from "@/hooks/useDashboard";

const ExpiringPackages = () => {
    const { data: packages = [], loading } = useExpiringPackages();

    return (
        <Card view="outlined" style={{ overflow: "hidden" }}>
            <div className="repeto-card-header">
                <Text variant="subheader-2">Истекающие пакеты</Text>
                <Link
                    href="/packages"
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--g-color-text-brand)",
                        textDecoration: "none",
                    }}
                >
                    Все →
                </Link>
            </div>
            {loading ? (
                <div style={{ padding: "24px 0", textAlign: "center" }}>
                    <Loader size="s" />
                </div>
            ) : packages.length === 0 ? (
                <div style={{ padding: "24px 20px", textAlign: "center" }}>
                    <Text variant="body-1" color="secondary">
                        Нет пакетов с истекающим сроком
                    </Text>
                </div>
            ) : (
                <div style={{ padding: "0 16px 16px" }}>
                    {packages.map((pkg) => {
                        const remaining = pkg.lessonsTotal - pkg.lessonsUsed;
                        const pct =
                            pkg.lessonsTotal > 0
                                ? Math.round(
                                      (pkg.lessonsUsed / pkg.lessonsTotal) * 100
                                  )
                                : 0;
                        const urgent = remaining <= 2;

                        return (
                            <div
                                key={pkg.id}
                                style={{
                                    padding: 14,
                                    marginTop: 8,
                                    borderRadius: 12,
                                    background: urgent
                                        ? "rgba(209,107,143,0.08)"
                                        : "rgba(174,122,255,0.04)",
                                    borderLeft: `3px solid ${urgent ? "#D16B8F" : "#AE7AFF"}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 8,
                                    }}
                                >
                                    <Text variant="body-2" ellipsis>
                                        {pkg.studentName}
                                    </Text>
                                    <Label
                                        theme={urgent ? "danger" : "normal"}
                                        size="xs"
                                    >
                                        до {pkg.validUntil}
                                    </Label>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 10,
                                    }}
                                >
                                    <Text variant="body-1" color="secondary">
                                        {pkg.subject}
                                    </Text>
                                    <Text variant="body-1">
                                        <strong>
                                            {pkg.lessonsUsed}/{pkg.lessonsTotal}
                                        </strong>{" "}
                                        <Text
                                            variant="body-1"
                                            color={urgent ? "danger" : "secondary"}
                                            as="span"
                                        >
                                            ({remaining} ост.)
                                        </Text>
                                    </Text>
                                </div>
                                <div className="repeto-progress-track">
                                    <div
                                        className="repeto-progress-fill"
                                        style={{
                                            width: `${pct}%`,
                                            background: urgent
                                                ? "linear-gradient(90deg, #D16B8F, #B85C7E)"
                                                : "linear-gradient(90deg, #AE7AFF, #7030D9)",
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

export default ExpiringPackages;
