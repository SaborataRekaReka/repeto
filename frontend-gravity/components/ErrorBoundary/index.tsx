import React from "react";

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        if (process.env.NODE_ENV !== "production") {
            console.error("ErrorBoundary caught:", error, info);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        padding: 40,
                        textAlign: "center",
                        fontFamily: "var(--g-text-body-font-family, sans-serif)",
                    }}
                >
                    <h2 style={{ fontSize: 24, marginBottom: 12 }}>
                        Что-то пошло не так
                    </h2>
                    <p style={{ fontSize: 16, color: "#666", marginBottom: 24 }}>
                        Произошла непредвиденная ошибка. Попробуйте обновить страницу.
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false });
                            window.location.reload();
                        }}
                        style={{
                            padding: "10px 24px",
                            fontSize: 14,
                            borderRadius: 8,
                            border: "none",
                            backgroundColor: "var(--accent)",
                            color: "var(--repeto-on-brand, #fff)",
                            cursor: "pointer",
                        }}
                    >
                        Обновить страницу
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
