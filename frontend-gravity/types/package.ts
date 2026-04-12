export type PackageStatus = "active" | "completed" | "expired";

export type LessonPackage = {
    id: string;
    studentId: string;
    studentName: string;
    subject: string;
    lessonsTotal: number;
    lessonsUsed: number;
    totalPrice: number;
    comment?: string;
    status: PackageStatus;
    validUntil: string;
    validUntilValue?: string;
    createdAt: string;
};
