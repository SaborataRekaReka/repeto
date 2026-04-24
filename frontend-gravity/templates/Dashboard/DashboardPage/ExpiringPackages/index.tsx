import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowChevronLeft, ArrowChevronRight, ChevronRight } from "@gravity-ui/icons";
import { Button, Card, Icon, Text, Loader } from "@gravity-ui/uikit";
import type { IconData } from "@gravity-ui/uikit";
import { useExpiringPackages } from "@/hooks/useDashboard";
import StudentNameWithBadge from "@/components/StudentNameWithBadge";

const getLessonsLeftLabel = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return "занятие осталось";
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return "занятия осталось";
    }

    return "занятий осталось";
};

const ExpiringPackages = () => {
    const { data: packages = [], loading } = useExpiringPackages();
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (packages.length === 0) {
            setActiveIndex(0);
            return;
        }

        setActiveIndex((current) => Math.min(current, packages.length - 1));
    }, [packages.length]);

    const hasMultiplePackages = packages.length > 1;
    const currentPackage = packages[activeIndex];
    const bodyClassName = "repeto-card-body repeto-expiring-packages repeto-expiring-packages--single";

    const showPrevPackage = () => {
        setActiveIndex((current) => (current - 1 + packages.length) % packages.length);
    };

    const showNextPackage = () => {
        setActiveIndex((current) => (current + 1) % packages.length);
    };

    return (
        <Card
            className="repeto-expiring-packages-card repeto-section-card"
            view="outlined"
            style={{ overflow: "hidden" }}
        >
            <div className="repeto-card-header">
                <Text variant="subheader-2">Истекающие пакеты</Text>
                <div className="repeto-expiring-packages__actions">
                    {hasMultiplePackages && (
                        <div className="repeto-expiring-packages__nav">
                            <Button
                                view="flat"
                                size="s"
                                aria-label="Предыдущий пакет"
                                className="repeto-expiring-packages__nav-button"
                                onClick={showPrevPackage}
                            >
                                <Icon data={ArrowChevronLeft as IconData} size={14} />
                            </Button>
                            <Button
                                view="flat"
                                size="s"
                                aria-label="Следующий пакет"
                                className="repeto-expiring-packages__nav-button"
                                onClick={showNextPackage}
                            >
                                <Icon data={ArrowChevronRight as IconData} size={14} />
                            </Button>
                        </div>
                    )}
                    <Link
                        href="/packages"
                        className="repeto-card-chevron"
                        aria-label="Открыть пакеты"
                    >
                        <Icon data={ChevronRight as IconData} size={18} />
                    </Link>
                </div>
            </div>
            {loading ? (
                <div className="repeto-card-body repeto-expiring-packages__state">
                    <Loader size="s" />
                </div>
            ) : packages.length === 0 ? (
                <div className="repeto-card-body repeto-expiring-packages__state">
                    <Text variant="body-1" color="secondary">
                        Нет пакетов с истекающим сроком
                    </Text>
                </div>
            ) : (
                <div className={bodyClassName}>
                    {currentPackage && (() => {
                        const remaining = currentPackage.lessonsTotal - currentPackage.lessonsUsed;
                        const pct =
                            currentPackage.lessonsTotal > 0
                                ? Math.round(
                                      (currentPackage.lessonsUsed / currentPackage.lessonsTotal) * 100
                                  )
                                : 0;
                        const urgent = remaining <= 2;
                        const progressColor = urgent
                            ? "var(--g-color-base-danger)"
                            : "var(--g-color-base-brand)";
                        const remainingLabel = getLessonsLeftLabel(remaining);
                        const itemClassName = [
                            "repeto-expiring-packages__item",
                            urgent ? "repeto-expiring-packages__item--urgent" : "",
                            "repeto-expiring-packages__item--single",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        return (
                            <div key={currentPackage.id} className={itemClassName}>
                                <div className="repeto-expiring-packages__top">
                                    <div className="repeto-expiring-packages__primary">
                                        <Text variant="body-2" ellipsis className="repeto-dashboard-entity-name">
                                            <StudentNameWithBadge
                                                name={currentPackage.studentName}
                                                hasRepetoAccount={Boolean(currentPackage.studentAccountId)}
                                                truncate
                                            />
                                        </Text>
                                        <Text
                                            variant="body-1"
                                            color="secondary"
                                            ellipsis
                                            className="repeto-expiring-packages__subject"
                                        >
                                            {currentPackage.subject}
                                        </Text>
                                    </div>
                                    <span className="repeto-expiring-packages__deadline">
                                        до {currentPackage.validUntil}
                                    </span>
                                </div>
                                <div className="repeto-expiring-packages__summary">
                                    <div
                                        className={[
                                            "repeto-expiring-packages__main-metric",
                                            urgent ? "repeto-expiring-packages__main-metric--urgent" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    >
                                        <span className="repeto-expiring-packages__main-metric-value">
                                            {remaining}
                                        </span>
                                        <span className="repeto-expiring-packages__main-metric-label">
                                            {remainingLabel}
                                        </span>
                                    </div>
                                    <span className="repeto-expiring-packages__metric repeto-expiring-packages__metric--count repeto-dashboard-inline-value">
                                        {currentPackage.lessonsUsed} из {currentPackage.lessonsTotal}
                                    </span>
                                </div>
                                <div className="repeto-progress-track repeto-expiring-packages__track">
                                    <div
                                        className="repeto-progress-fill"
                                        style={{
                                            width: `${pct}%`,
                                            background: progressColor,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </Card>
    );
};

export default ExpiringPackages;
