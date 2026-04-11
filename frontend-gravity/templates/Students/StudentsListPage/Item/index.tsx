import Link from "next/link";
import { Text, Label } from "@gravity-ui/uikit";
import type { Student } from "@/types/student";
import {
    formatBalance,
    getStatusLabel,
    getInitials,
} from "@/mocks/students";

type ItemProps = {
    item: Student;
};

const statusTheme = (status: Student["status"]): "success" | "normal" => {
    switch (status) {
        case "active":
            return "success";
        default:
            return "normal";
    }
};

const Item = ({ item }: ItemProps) => (
    <Link
        href={`/students/${item.id}`}
        style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            textDecoration: "none",
            borderBottom: "1px solid var(--g-color-line-generic)",
            transition: "background 0.12s",
        }}
    >
        <div className="repeto-avatar repeto-avatar--md">
            {getInitials(item.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: "0 12px" }}>
            <Text variant="body-2" ellipsis>
                {item.name}
            </Text>
            <Text variant="body-1" color="secondary">
                {item.subject} · {item.grade}
                {item.grade !== "Взрослый" ? " класс" : ""}
            </Text>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
            <Text
                variant="body-2"
                style={{
                    color:
                        item.balance < 0
                            ? "#D16B8F"
                            : item.balance > 0
                            ? "#22C55E"
                            : undefined,
                }}
            >
                {formatBalance(item.balance)}
            </Text>
            <div style={{ marginTop: 2 }}>
                <Label theme={statusTheme(item.status)} size="xs">
                    {getStatusLabel(item.status)}
                </Label>
            </div>
        </div>
    </Link>
);

export default Item;
