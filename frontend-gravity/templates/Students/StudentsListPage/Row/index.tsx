import { useRouter } from "next/router";
import { Text, Label, DropdownMenu, Icon, Button, Avatar } from "@gravity-ui/uikit";
import { Ellipsis } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";
import type { Student } from "@/types/student";
import {
    formatBalance,
    getStatusLabel,
    getInitials,
} from "@/mocks/students";

type RowProps = {
    item: Student;
    onScheduleLesson?: () => void;
    onMessage?: () => void;
};

const statusTheme = (status: Student["status"]): "success" | "normal" => {
    switch (status) {
        case "active":
            return "success";
        default:
            return "normal";
    }
};

const Row = ({ item, onScheduleLesson, onMessage }: RowProps) => {
    const router = useRouter();

    return (
        <tr onClick={() => router.push(`/students/${item.id}`)}>
            <td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar text={getInitials(item.name)} size="m" theme="brand" />
                    <Text variant="body-2">{item.name}</Text>
                </div>
            </td>
            <td>
                <Text variant="body-1" color="secondary">{item.subject}</Text>
            </td>
            <td>
                <Text variant="body-1" color="secondary">{item.grade}</Text>
            </td>
            <td>
                <Text variant="body-1">{item.rate.toLocaleString("ru-RU")} ₽</Text>
            </td>
            <td>
                <Text
                    variant="body-2"
                    style={{
                        color: item.balance < 0 ? "#D16B8F" : item.balance > 0 ? "#22C55E" : undefined,
                    }}
                >
                    {formatBalance(item.balance)}
                </Text>
            </td>
            <td>
                <Label theme={statusTheme(item.status)} size="xs">
                    {getStatusLabel(item.status)}
                </Label>
            </td>
            <td onClick={(e) => e.stopPropagation()}>
                <DropdownMenu
                    switcher={
                        <Button view="flat" size="s">
                            <Icon data={Ellipsis as IconData} size={16} />
                        </Button>
                    }
                    items={[
                        {
                            text: "Открыть",
                            action: () => router.push(`/students/${item.id}`),
                        },
                        {
                            text: "Назначить занятие",
                            action: () => onScheduleLesson?.(),
                        },
                        {
                            text: "Написать",
                            action: () => onMessage?.(),
                        },
                    ]}
                />
            </td>
        </tr>
    );
};

export default Row;
