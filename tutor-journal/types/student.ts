export type StudentStatus = "active" | "paused" | "archived";

export type Student = {
    id: string;
    name: string;
    subject: string;
    grade: string; // "11" or "Взрослый"
    rate: number; // rubles per lesson
    balance: number; // positive = overpaid, negative = debt
    status: StudentStatus;
    phone?: string;
    telegram?: string;
    parentName?: string;
    parentPhone?: string;
    parentTelegram?: string;
    parentEmail?: string;
    notes?: string;
};
