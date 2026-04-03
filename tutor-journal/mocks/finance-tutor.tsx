import type {
    Payment,
    PaymentStatus,
    PaymentMethod,
    StudentBalance,
} from "@/types/finance";

// --- Payments ---
export const payments: Payment[] = [
    {
        id: "p1",
        studentId: "3",
        studentName: "Сидоров Максим",
        amount: 4800,
        date: "02.04.2026",
        method: "transfer",
        status: "paid",
    },
    {
        id: "p2",
        studentId: "2",
        studentName: "Петрова Анна",
        amount: 3600,
        date: "01.04.2026",
        method: "cash",
        status: "paid",
    },
    {
        id: "p3",
        studentId: "5",
        studentName: "Новиков Дмитрий",
        amount: 2100,
        date: "01.04.2026",
        method: "transfer",
        status: "paid",
    },
    {
        id: "p4",
        studentId: "1",
        studentName: "Иванов Пётр",
        amount: 2100,
        date: "31.03.2026",
        method: "transfer",
        status: "paid",
    },
    {
        id: "p5",
        studentId: "4",
        studentName: "Кузнецова Мария",
        amount: 1600,
        date: "30.03.2026",
        method: "cash",
        status: "paid",
    },
    {
        id: "p6",
        studentId: "1",
        studentName: "Иванов Пётр",
        amount: 4200,
        date: "28.03.2026",
        method: "sbp",
        status: "paid",
    },
    {
        id: "p7",
        studentId: "6",
        studentName: "Козлова Дарья",
        amount: 2200,
        date: "27.03.2026",
        method: "transfer",
        status: "pending",
    },
    {
        id: "p8",
        studentId: "2",
        studentName: "Петрова Анна",
        amount: 3600,
        date: "25.03.2026",
        method: "cash",
        status: "paid",
    },
    {
        id: "p9",
        studentId: "3",
        studentName: "Сидоров Максим",
        amount: 2400,
        date: "22.03.2026",
        method: "sbp",
        status: "paid",
    },
    {
        id: "p10",
        studentId: "4",
        studentName: "Кузнецова Мария",
        amount: 3200,
        date: "20.03.2026",
        method: "cash",
        status: "overdue",
    },
    {
        id: "p11",
        studentId: "5",
        studentName: "Новиков Дмитрий",
        amount: 4200,
        date: "18.03.2026",
        method: "transfer",
        status: "paid",
    },
    {
        id: "p12",
        studentId: "6",
        studentName: "Козлова Дарья",
        amount: 2200,
        date: "15.03.2026",
        method: "sbp",
        status: "overdue",
    },
    {
        id: "p13",
        studentId: "1",
        studentName: "Иванов Пётр",
        amount: 2100,
        date: "14.03.2026",
        method: "transfer",
        status: "paid",
    },
    {
        id: "p14",
        studentId: "3",
        studentName: "Сидоров Максим",
        amount: 4800,
        date: "10.03.2026",
        method: "sbp",
        status: "paid",
    },
    {
        id: "p15",
        studentId: "2",
        studentName: "Петрова Анна",
        amount: 1800,
        date: "08.03.2026",
        method: "cash",
        status: "paid",
    },
];

// --- Helpers ---
export function getMethodLabel(method: PaymentMethod): string {
    switch (method) {
        case "sbp":
            return "СБП";
        case "cash":
            return "Наличные";
        case "transfer":
            return "Перевод";
    }
}

export function getStatusLabel(status: PaymentStatus): string {
    switch (status) {
        case "paid":
            return "Оплачено";
        case "pending":
            return "Ожидает";
        case "overdue":
            return "Просрочено";
    }
}

export function getStatusColor(status: PaymentStatus): string {
    switch (status) {
        case "paid":
            return "bg-green-1 text-n-1";
        case "pending":
            return "bg-yellow-1 text-n-1";
        case "overdue":
            return "bg-pink-1 text-n-1";
    }
}

// --- Student balances for finance overview ---
export const studentBalances: StudentBalance[] = [
    {
        studentId: "1",
        studentName: "Иванов Пётр",
        subject: "Математика",
        lessonsCount: 6,
        totalAmount: 12600,
        paidAmount: 8400,
        debt: 4200,
    },
    {
        studentId: "2",
        studentName: "Петрова Анна",
        subject: "Английский",
        lessonsCount: 5,
        totalAmount: 9000,
        paidAmount: 9000,
        debt: 0,
    },
    {
        studentId: "3",
        studentName: "Сидоров Максим",
        subject: "Физика",
        lessonsCount: 4,
        totalAmount: 9600,
        paidAmount: 12000,
        debt: -2400,
    },
    {
        studentId: "4",
        studentName: "Кузнецова Мария",
        subject: "Русский язык",
        lessonsCount: 4,
        totalAmount: 6400,
        paidAmount: 3200,
        debt: 3200,
    },
    {
        studentId: "5",
        studentName: "Новиков Дмитрий",
        subject: "Математика",
        lessonsCount: 4,
        totalAmount: 8400,
        paidAmount: 8400,
        debt: 0,
    },
    {
        studentId: "6",
        studentName: "Козлова Дарья",
        subject: "Английский",
        lessonsCount: 3,
        totalAmount: 6600,
        paidAmount: 4400,
        debt: 2200,
    },
];

// --- Finance stat cards ---
export const financeStats = {
    incomeMonth: payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0),
    expected: payments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0),
    expectedCount: new Set(
        payments.filter((p) => p.status === "pending").map((p) => p.studentId)
    ).size,
    overdue: payments
        .filter((p) => p.status === "overdue")
        .reduce((sum, p) => sum + p.amount, 0),
    overdueCount: new Set(
        payments.filter((p) => p.status === "overdue").map((p) => p.studentId)
    ).size,
};

// --- Income chart data (by week) ---
export const financeChartData = [
    { name: "Нед 1", received: 16500, expected: 5700 },
    { name: "Нед 2", received: 12100, expected: 4200 },
    { name: "Нед 3", received: 8400, expected: 5400 },
    { name: "Нед 4", received: 0, expected: 6300 },
];

// --- Payment methods distribution ---
export const paymentMethodsData = [
    {
        name: "СБП",
        value: payments
            .filter((p) => p.method === "sbp" && p.status === "paid")
            .reduce((s, p) => s + p.amount, 0),
        color: "#B89AFF",
    },
    {
        name: "Наличные",
        value: payments
            .filter((p) => p.method === "cash" && p.status === "paid")
            .reduce((s, p) => s + p.amount, 0),
        color: "#FAE8A4",
    },
    {
        name: "Перевод",
        value: payments
            .filter((p) => p.method === "transfer" && p.status === "paid")
            .reduce((s, p) => s + p.amount, 0),
        color: "#98E9AB",
    },
];
