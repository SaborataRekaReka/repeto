import Link from "next/link";
import { Card, Text, Label } from "@gravity-ui/uikit";

type PostProps = { item: any };

const Post = ({ item }: PostProps) => (
    <Link href={item.id ? `/support/article?id=${item.id}` : "/support/article"} style={{ textDecoration: "none", color: "inherit" }}>
        <Card view="outlined" style={{
            padding: 20, background: "var(--g-color-base-float)", cursor: "pointer", height: "100%",
            display: "flex", flexDirection: "column",
            transition: "box-shadow 0.15s, border-color 0.15s",
        }}>
            {item.category && (
                <div style={{ marginBottom: 12 }}>
                    <Label theme="info" size="s">{item.category}</Label>
                </div>
            )}
            <Text variant="body-1" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>{item.title}</Text>
            <Text variant="caption-2" color="secondary" style={{ display: "block", flex: 1 }}>{item.content}</Text>
            <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: "var(--g-color-text-brand)" }}>
                Читать далее →
            </div>
        </Card>
    </Link>
);

export default Post;
