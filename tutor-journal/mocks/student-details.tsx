// Mock data for student notes and homeworks

export type StudentNote = {
    id: string;
    studentId: string;
    date: string;
    time: string;
    text: string;
};

export type StudentHomework = {
    id: string;
    studentId: string;
    date: string;
    task: string;
    dueDate: string;
    status: "not_done" | "done" | "overdue";
};

export const studentNotes: StudentNote[] = [
    {
        id: "n1",
        studentId: "1",
        date: "3 апреля 2026",
        time: "16:10",
        text: "Прошли квадратные уравнения через дискриминант. Ошибки: путает знак при b < 0. Дополнительно разобрали метод Виета.",
    },
    {
        id: "n2",
        studentId: "1",
        date: "1 апреля 2026",
        time: "16:05",
        text: "Повторили степени и корни. Уверенно решает стандартные задачи, но теряется в комбинированных примерах.",
    },
    {
        id: "n3",
        studentId: "1",
        date: "27 марта 2026",
        time: "16:15",
        text: "Разобрали параметрические уравнения. Тема сложная, нужна доработка.",
    },
    {
        id: "n4",
        studentId: "2",
        date: "2 апреля 2026",
        time: "15:05",
        text: "Present Perfect vs Past Simple. Хорошо различает, но ошибается в выборе since/for.",
    },
    {
        id: "n5",
        studentId: "2",
        date: "30 марта 2026",
        time: "15:00",
        text: "Разобрали условные предложения (Conditionals I–II). Домашка на закрепление.",
    },
    {
        id: "n6",
        studentId: "3",
        date: "1 апреля 2026",
        time: "17:10",
        text: "Законы Ньютона, задачи на наклонную плоскость. Уверенно решает.",
    },
    {
        id: "n7",
        studentId: "4",
        date: "31 марта 2026",
        time: "14:05",
        text: "Сочинение-рассуждение: структура, речевые клише. Нужно работать над аргументацией.",
    },
];

export const studentHomeworks: StudentHomework[] = [
    {
        id: "hw1",
        studentId: "1",
        date: "3 апр 2026",
        task: "§14, №3-7. Квадратные уравнения через дискриминант.",
        dueDate: "До 7 апр",
        status: "not_done",
    },
    {
        id: "hw2",
        studentId: "1",
        date: "1 апр 2026",
        task: "Степени и корни: задания 12-18 из сборника.",
        dueDate: "До 3 апр",
        status: "done",
    },
    {
        id: "hw3",
        studentId: "1",
        date: "27 мар 2026",
        task: "Параметрические уравнения: 5 задач из доп. материала.",
        dueDate: "До 1 апр",
        status: "overdue",
    },
    {
        id: "hw4",
        studentId: "2",
        date: "2 апр 2026",
        task: "Murphy Unit 23-24, exercises A-D. Present Perfect.",
        dueDate: "До 6 апр",
        status: "not_done",
    },
    {
        id: "hw5",
        studentId: "2",
        date: "30 мар 2026",
        task: "Conditionals: 10 предложений перевод + эссе 120 слов.",
        dueDate: "До 2 апр",
        status: "done",
    },
    {
        id: "hw6",
        studentId: "3",
        date: "1 апр 2026",
        task: "Задачи на законы Ньютона: №15-22 из задачника.",
        dueDate: "До 4 апр",
        status: "not_done",
    },
    {
        id: "hw7",
        studentId: "4",
        date: "31 мар 2026",
        task: "Написать сочинение-рассуждение по теме «Роль книг в жизни человека».",
        dueDate: "До 5 апр",
        status: "not_done",
    },
];
