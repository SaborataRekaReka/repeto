import { useState } from "react";
import Field from "@/components/Field";

const Account = () => {
    const [name, setName] = useState("Смирнов Алексей Иванович");
    const [email, setEmail] = useState("tutor@repetitorjournal.ru");
    const [phone, setPhone] = useState("+7 916 123-45-67");
    const [telegram, setTelegram] = useState("@alexey_tutor");
    const [subjects, setSubjects] = useState("Математика, Физика");
    const [about, setAbout] = useState(
        "Преподаю математику и физику 10 лет. Подготовка к ЕГЭ и ОГЭ."
    );

    return (
        <div className="card">
            <div className="card-title">Данные аккаунта</div>
            <div className="p-5">
                <div className="flex flex-wrap -mt-4 -mx-2.5">
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="Имя"
                            type="text"
                            placeholder="ФИО"
                            value={name}
                            onChange={(e: any) => setName(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="Email"
                            type="email"
                            placeholder="email@example.com"
                            icon="email"
                            value={email}
                            onChange={(e: any) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="Телефон"
                            type="tel"
                            placeholder="+7 900 123-45-67"
                            value={phone}
                            onChange={(e: any) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]">
                        <Field
                            label="Telegram"
                            type="text"
                            placeholder="@username"
                            value={telegram}
                            onChange={(e: any) => setTelegram(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(100%-1.25rem)]">
                        <Field
                            label="Предметы"
                            type="text"
                            placeholder="Математика, Физика"
                            value={subjects}
                            onChange={(e: any) => setSubjects(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 mx-2.5 w-[calc(100%-1.25rem)]">
                        <Field
                            label="О себе"
                            type="text"
                            placeholder="Краткая биография..."
                            value={about}
                            onChange={(e: any) => setAbout(e.target.value)}
                            textarea
                        />
                    </div>
                </div>
                <div className="flex justify-between mt-10 md:block md:mt-8">
                    <button className="btn-stroke min-w-[11.7rem] md:w-full md:mb-3">
                        Сбросить
                    </button>
                    <button className="btn-purple min-w-[11.7rem] md:w-full">
                        Сохранить изменения
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Account;
