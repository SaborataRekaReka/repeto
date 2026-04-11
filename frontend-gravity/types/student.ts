export type StudentStatus = "active" | "paused" | "archived";

export type Student = {
    id: string;
    name: string;
    subject: string;
    grade: string; // "11" or "Взрослый"
    age?: number; // student's age
    rate: number; // rubles per lesson
    balance: number; // positive = overpaid, negative = debt
    status: StudentStatus;
    phone?: string;
    whatsapp?: string;
    telegram?: string; // legacy, kept for data compatibility
    parentName?: string;
    parentPhone?: string;
    parentWhatsapp?: string;
    parentTelegram?: string; // legacy
    parentEmail?: string;
    telegramChatId?: string;
    maxChatId?: string;
    notes?: string;
};
