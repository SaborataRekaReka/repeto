import type { Student } from "@/types/student";

export const students: Student[] = [
    {
        id: "1",
        name: "Иванов Пётр",
        subject: "Математика",
        grade: "11",
        rate: 2100,
        balance: -4200,
        status: "active",
        phone: "+7 900 123-45-67",
        telegram: "@petya_ivanov",
        parentName: "Иванова Мария",
        parentPhone: "+7 900 765-43-21",
        parentTelegram: "@mama_ivanova",
    },
    {
        id: "2",
        name: "Петрова Анна",
        subject: "Английский",
        grade: "9",
        rate: 1800,
        balance: 0,
        status: "active",
        phone: "+7 911 222-33-44",
        telegram: "@anna_eng",
        parentName: "Петров Алексей",
        parentPhone: "+7 911 555-66-77",
    },
    {
        id: "3",
        name: "Сидоров Максим",
        subject: "Физика",
        grade: "10",
        rate: 2400,
        balance: 2400,
        status: "active",
        phone: "+7 925 111-22-33",
        telegram: "@max_physics",
    },
    {
        id: "4",
        name: "Кузнецова Мария",
        subject: "Русский язык",
        grade: "8",
        rate: 1600,
        balance: -3200,
        status: "active",
        parentName: "Кузнецова Елена",
        parentPhone: "+7 903 444-55-66",
        parentEmail: "kuznetsova.elena@mail.ru",
    },
    {
        id: "5",
        name: "Новиков Дмитрий",
        subject: "Математика",
        grade: "11",
        rate: 2100,
        balance: 0,
        status: "active",
        phone: "+7 916 333-44-55",
        telegram: "@dima_novikov",
        parentName: "Новикова Ольга",
        parentPhone: "+7 916 666-77-88",
    },
    {
        id: "6",
        name: "Козлова Дарья",
        subject: "Английский",
        grade: "Взрослый",
        rate: 2200,
        balance: -2200,
        status: "active",
        phone: "+7 926 999-00-11",
        telegram: "@dasha_kozlova",
    },
    {
        id: "7",
        name: "Волков Артём",
        subject: "Математика",
        grade: "9",
        rate: 2100,
        balance: 0,
        status: "paused",
        phone: "+7 905 222-11-33",
        notes: "На каникулах до мая",
    },
    {
        id: "8",
        name: "Лебедева Софья",
        subject: "Физика",
        grade: "11",
        rate: 2400,
        balance: 0,
        status: "archived",
        phone: "+7 917 888-77-66",
        notes: "Поступила, занятия закончены",
    },
    {
        id: "9",
        name: "Морозов Егор",
        subject: "Русский язык",
        grade: "7",
        rate: 1600,
        balance: 1600,
        status: "paused",
        parentName: "Морозова Татьяна",
        parentPhone: "+7 903 111-99-88",
        notes: "Перерыв по семейным обстоятельствам",
    },
];

export function formatBalance(balance: number): string {
    const abs = Math.abs(balance).toLocaleString("ru-RU");
    if (balance > 0) return `+${abs} ₽`;
    if (balance < 0) return `-${abs} ₽`;
    return `0 ₽`;
}

export function getBalanceColor(balance: number): string {
    if (balance > 0) return "text-green-1";
    if (balance < 0) return "text-pink-1";
    return "text-n-3 dark:text-white/50";
}

export function getStatusLabel(status: Student["status"]): string {
    switch (status) {
        case "active":
            return "Активен";
        case "paused":
            return "На паузе";
        case "archived":
            return "Архив";
    }
}

export function getStatusColor(status: Student["status"]): string {
    switch (status) {
        case "active":
            return "bg-green-1";
        case "paused":
            return "bg-yellow-1";
        case "archived":
            return "bg-n-4 dark:bg-white/20";
    }
}

export function getInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return parts[0][0];
}

export function getSubjectBgColor(subject: string): string {
    switch (subject) {
        case "Математика":
            return "bg-purple-3 dark:bg-purple-1/20";
        case "Английский":
            return "bg-green-2 dark:bg-green-1/20";
        case "Физика":
            return "bg-yellow-2 dark:bg-yellow-1/20";
        default:
            return "bg-n-4/50 dark:bg-white/10";
    }
}
