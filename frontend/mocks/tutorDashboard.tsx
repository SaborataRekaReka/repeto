import { lessons } from "@/mocks/schedule";
import { students } from "@/mocks/students";

// --- Stat cards ---
export const statCards = [
    {
        id: "students",
        title: "Активных учеников",
        value: students.filter((s) => s.status === "active").length,
        icon: "profile",
        color: "bg-purple-3 dark:bg-purple-1/20",
        href: "/students",
    },
    {
        id: "lessons",
        title: "Занятий в апреле",
        value: lessons.filter((l) => l.date.startsWith("2026-04")).length,
        icon: "calendar",
        color: "bg-green-2 dark:bg-green-1/20",
        href: "/schedule",
    },
    {
        id: "income",
        title: "Доход за апрель",
        value:
            lessons
                .filter((l) => l.date.startsWith("2026-04"))
                .reduce((sum, l) => sum + l.rate, 0),
        formatted: true,
        suffix: " ₽",
        icon: "wallet",
        color: "bg-yellow-2 dark:bg-yellow-1/20",
        href: "/finance",
    },
    {
        id: "debt",
        title: "К оплате учениками",
        value: Math.abs(
            students
                .filter((s) => s.balance < 0)
                .reduce((sum, s) => sum + s.balance, 0)
        ),
        formatted: true,
        suffix: " ₽",
        icon: "card",
        color: "bg-pink-2 dark:bg-pink-1/20",
        href: "/finance/payments",
    },
];

// --- Today's lessons (April 3, 2026) ---
export const todayLessons = lessons.filter((l) => l.date === "03.04.2026");

// --- Debt list ---
export const debtStudents = students.filter((s) => s.balance < 0);

// --- Recent payments (mock) ---
export type Payment = {
    id: string;
    date: string;
    studentName: string;
    amount: number;
    method: string;
    status: "received" | "pending";
};

export const recentPayments: Payment[] = [
    {
        id: "p1",
        date: "02.04.2026",
        studentName: "Сидоров Максим",
        amount: 4800,
        method: "Перевод",
        status: "received",
    },
    {
        id: "p2",
        date: "01.04.2026",
        studentName: "Петрова Анна",
        amount: 3600,
        method: "Наличные",
        status: "received",
    },
    {
        id: "p3",
        date: "01.04.2026",
        studentName: "Новиков Дмитрий",
        amount: 2100,
        method: "Перевод",
        status: "received",
    },
    {
        id: "p4",
        date: "31.03.2026",
        studentName: "Иванов Пётр",
        amount: 2100,
        method: "Перевод",
        status: "received",
    },
    {
        id: "p5",
        date: "30.03.2026",
        studentName: "Кузнецова Мария",
        amount: 1600,
        method: "Наличные",
        status: "pending",
    },
];

// --- Income chart data ---
export const incomeChartData = [
    { name: "Нед 1", received: 16500, expected: 5700 },
    { name: "Нед 2", received: 8400, expected: 4200 },
    { name: "Нед 3", received: 0, expected: 5500 },
    { name: "Нед 4", received: 0, expected: 5500 },
];
