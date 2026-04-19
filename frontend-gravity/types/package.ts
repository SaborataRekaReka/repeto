export type PackageStatus = "active" | "completed" | "expired";

export type LessonPackage = {
    id: string;
    studentId?: string;
    studentName: string;
    studentAccountId?: string | null;
    subject: string;
    lessonsTotal: number;
    lessonsUsed: number;
    totalPrice: number;
    comment?: string;
    isPublic: boolean;
    status: PackageStatus;
    validUntil: string;
    validUntilValue?: string;
    createdAt: string;
    createdAtValue?: string;
};
