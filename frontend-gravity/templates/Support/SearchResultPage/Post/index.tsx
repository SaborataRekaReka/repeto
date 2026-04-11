import Link from "next/link";
import { Card, Text } from "@gravity-ui/uikit";

type PostProps = { item: any };

const Post = ({ item }: PostProps) => (
    <Link href={item.id ? `/support/article?id=${item.id}` : "/support/article"} style={{ textDecoration: "none", color: "inherit" }}>
        <Card view="outlined" style={{
            padding: "16px 24px", background: "var(--g-color-base-float)", cursor: "pointer",
            transition: "border-color 0.15s",
        }}>
            <Text variant="body-1" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>{item.title}</Text>
            <Text variant="caption-2" color="secondary" style={{ display: "block", marginBottom: 10 }}>{item.content}</Text>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--g-color-text-brand)" }}>
                Читать далее →
            </div>
        </Card>
    </Link>
);

export default Post;
