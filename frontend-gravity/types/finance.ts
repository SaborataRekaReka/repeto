export type PaymentStatus = "paid";
export type PaymentMethod = "sbp" | "cash" | "transfer" | "yukassa";

export type Payment = {
    id: string;
    studentId: string;
    studentName: string;
    lessonId?: string;
    lessonSubject?: string;
    lessonDate?: string;
    amount: number;
    date: string; // DD.MM.YYYY
    method: PaymentMethod;
    status: PaymentStatus;
    comment?: string;
    externalPaymentId?: string;
    isManual?: boolean;
};

export type StudentBalance = {
    studentId: string;
    studentName: string;
    subject: string;
    lessonsCount: number;
    totalAmount: number;
    paidAmount: number;
    debt: number;
};
