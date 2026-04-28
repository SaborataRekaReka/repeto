import { TextInput, TextArea, Text } from "@gravity-ui/uikit";
import PhoneInput from "@/components/PhoneInput";
import FormField from "../FormField";
import SectionCard from "../SectionCard";

type Props = {
    name: string; setName: (v: string) => void;
    email: string;
    phone: string; setPhone: (v: string) => void;
    whatsapp: string; setWhatsapp: (v: string) => void;
    vk: string; setVk: (v: string) => void;
    website: string; setWebsite: (v: string) => void;
    about: string; setAbout: (v: string) => void;
};

const PersonalDataSection = ({ name, setName, email, phone, setPhone, whatsapp, setWhatsapp, vk, setVk, website, setWebsite, about, setAbout }: Props) => (
    <SectionCard title="Личные данные">
        <div className="repeto-settings-account-grid">
            <FormField label="Ваше имя">
                <TextInput value={name} onUpdate={setName} placeholder="Смирнов Алексей Иванович" size="l" />
            </FormField>
            <FormField label="Email">
                <TextInput value={email} disabled placeholder="email@example.com" size="l" />
                <Text variant="caption-2" color="secondary" style={{ display: "block", marginTop: 4 }}>
                    Изменение email пока недоступно
                </Text>
            </FormField>
            <FormField label="Телефон">
                <PhoneInput value={phone} onUpdate={setPhone} />
            </FormField>
            <FormField label="WhatsApp">
                <PhoneInput value={whatsapp} onUpdate={setWhatsapp} />
            </FormField>
            <FormField label="ВКонтакте">
                <TextInput value={vk} onUpdate={setVk} placeholder="https://vk.com/username" size="l" />
            </FormField>
            <FormField label="Сайт">
                <TextInput value={website} onUpdate={setWebsite} placeholder="https://my-site.ru" size="l" />
            </FormField>
            <FormField label="О себе" full>
                <TextArea value={about} onUpdate={setAbout} placeholder="Опыт, подход, результаты учеников" rows={4} size="l" />
            </FormField>
        </div>
    </SectionCard>
);

export default PersonalDataSection;
