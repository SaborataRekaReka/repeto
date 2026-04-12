import { useThemeMode } from "@/contexts/ThemeContext";
import { Icon, Button } from "@gravity-ui/uikit";
import { Sun, Moon } from "@gravity-ui/icons";
import type { IconData } from "@gravity-ui/uikit";

type ToggleThemeProps = {};

const ToggleTheme = ({}: ToggleThemeProps) => {
    const { theme, setTheme } = useThemeMode();

    return (
        <div style={{ display: "flex", gap: 4 }}>
            <Button
                view={theme === "light" ? "action" : "flat"}
                size="s"
                onClick={() => setTheme("light")}
                title="Светлая тема"
            >
                <Icon data={Sun as IconData} size={16} />
            </Button>
            <Button
                view={theme === "dark" ? "action" : "flat"}
                size="s"
                onClick={() => setTheme("dark")}
                title="Тёмная тема"
            >
                <Icon data={Moon as IconData} size={16} />
            </Button>
        </div>
    );
};

export default ToggleTheme;
