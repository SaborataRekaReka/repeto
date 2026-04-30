import fs from "fs";
import path from "path";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { Text } from "@gravity-ui/uikit";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type LegalPageProps = {
    markdown: string;
};

function removeHiddenCheckboxSection(source: string) {
    const lines = source.split("\n");
    const startIndex = lines.findIndex((line) => {
        const trimmed = line.trim();
        return /^##\s*10[.)]/.test(trimmed) || /<h2[^>]*>\s*10[.)]/i.test(trimmed);
    });

    if (startIndex === -1) return source;

    let endIndex = lines.length;
    for (let i = startIndex + 1; i < lines.length; i += 1) {
        const trimmed = lines[i].trim();
        if (/^##\s+/.test(trimmed) || /^<h2\b/i.test(trimmed)) {
            endIndex = i;
            break;
        }
    }

    return [...lines.slice(0, startIndex), ...lines.slice(endIndex)].join("\n");
}

export const getStaticProps: GetStaticProps<LegalPageProps> = async () => {
    const filePath = path.join(
        process.cwd(),
        "content",
        "legal",
        "repeto_legal_v1.md",
    );

    const source = fs.readFileSync(filePath, "utf-8");
    return {
        props: {
            markdown: removeHiddenCheckboxSection(source),
        },
    };
};

const LegalPage = ({ markdown }: LegalPageProps) => {
    return (
        <>
            <Head>
                <title>Юридическая информация Repeto</title>
                <meta
                    name="description"
                    content="Оферты, политика конфиденциальности, согласия на обработку персональных данных и cookie для сервиса Repeto."
                />
            </Head>

            <div className="repeto-legal-page">
                <div className="repeto-legal-container">
                    <div className="repeto-legal-topbar">
                        <Link href="/" className="repeto-legal-back-link">
                            На главную
                        </Link>
                        <Text variant="caption-2" color="secondary">
                            Версия документа: legal_v1_2026-04-29
                        </Text>
                    </div>

                    <article className="repeto-legal-markdown">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                a: ({ node: _node, ...props }) => (
                                    <a {...props} className="repeto-legal-link" />
                                ),
                            }}
                        >
                            {markdown}
                        </ReactMarkdown>
                    </article>
                </div>
            </div>
        </>
    );
};

export default LegalPage;
