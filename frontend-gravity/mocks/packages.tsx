import type { LessonPackage, PackageStatus } from "@/types/package";

export const packages: LessonPackage[] = [
    {
        id: "pkg1",
        studentId: "1",
        studentName: "Иванов Пётр",
        subject: "Математика",
        lessonsTotal: 8,
        lessonsUsed: 5,
        totalPrice: 16800,
        isPublic: false,
        status: "active",
        validUntil: "30.04.2026",
        createdAt: "01.03.2026",
    },
    {
        id: "pkg2",
        studentId: "2",
        studentName: "Петрова Анна",
        subject: "Английский",
        lessonsTotal: 10,
        lessonsUsed: 10,
        totalPrice: 18000,
        isPublic: false,
        status: "completed",
        validUntil: "15.03.2026",
        createdAt: "15.01.2026",
    },
    {
        id: "pkg3",
        studentId: "3",
        studentName: "Сидоров Максим",
        subject: "Физика",
        lessonsTotal: 8,
        lessonsUsed: 2,
        totalPrice: 19200,
        isPublic: true,
        status: "active",
        validUntil: "30.05.2026",
        createdAt: "01.04.2026",
    },
    {
        id: "pkg4",
        studentId: "5",
        studentName: "Новиков Дмитрий",
        subject: "Математика",
        lessonsTotal: 12,
        lessonsUsed: 7,
        totalPrice: 25200,
        isPublic: false,
        status: "active",
        validUntil: "15.05.2026",
        createdAt: "15.02.2026",
    },
    {
        id: "pkg5",
        studentId: "4",
        studentName: "Кузнецова Мария",
        subject: "Русский язык",
        lessonsTotal: 8,
        lessonsUsed: 8,
        totalPrice: 12800,
        isPublic: false,
        status: "completed",
        validUntil: "01.03.2026",
        createdAt: "01.01.2026",
    },
    {
        id: "pkg6",
        studentId: "6",
        studentName: "Козлова Дарья",
        subject: "Английский",
        lessonsTotal: 4,
        lessonsUsed: 1,
        totalPrice: 8800,
        isPublic: true,
        status: "active",
        validUntil: "15.06.2026",
        createdAt: "15.04.2026",
    },
    {
        id: "pkg7",
        studentId: "7",
        studentName: "Волков Артём",
        subject: "Математика",
        lessonsTotal: 8,
        lessonsUsed: 4,
        totalPrice: 16800,
        isPublic: false,
        status: "expired",
        validUntil: "01.02.2026",
        createdAt: "01.11.2025",
    },
];

export function getPackageStatusLabel(status: PackageStatus): string {
    switch (status) {
        case "active":
            return "Активен";
        case "completed":
            return "Завершён";
        case "expired":
            return "Истёк";
    }
}

export function getPackageStatusColor(status: PackageStatus): string {
    switch (status) {
        case "active":
            return "bg-green-1 text-n-1";
        case "completed":
            return "bg-n-4 text-n-3 dark:bg-white/20 dark:text-white/50";
        case "expired":
            return "bg-pink-1 text-n-1";
    }
}

export function getProgressColor(used: number, total: number): string {
    const pct = (total - used) / total;
    if (pct > 0.5) return "bg-green-1";
    if (pct > 0.25) return "bg-yellow-1";
    return "bg-pink-1";
}
