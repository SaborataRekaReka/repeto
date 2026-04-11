import Link from "next/link";
import { Card, Text } from "@gravity-ui/uikit";

type CategoryProps = { item: any };

const Category = ({ item }: CategoryProps) => (
    <Card view="outlined" style={{ padding: 20, background: "var(--g-color-base-float)" }}>
        <div style={{
            width: 44, height: 44, borderRadius: 10, marginBottom: 14,
            border: "1px solid var(--g-color-line-generic)",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <img src={item.icon} alt="" style={{ width: 18, height: 18 }} />
        </div>
        <Text variant="body-1" style={{ fontWeight: 600, display: "block", marginBottom: 12 }}>{item.title}</Text>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {item.links.map((link: any, i: number) => (
                <Link
                    key={i}
                    href={link.articleId ? `/support/article?id=${link.articleId}` : "/support/article"}
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--g-color-text-brand)", textDecoration: "none" }}
                >
                    {link.title || link}
                </Link>
            ))}
        </div>
    </Card>
);

export default Category;
