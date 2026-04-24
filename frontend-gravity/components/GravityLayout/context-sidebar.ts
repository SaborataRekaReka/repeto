import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { IconData } from "@gravity-ui/uikit";

export type ShellContextNavItem = {
    key: string;
    label: string;
    icon?: IconData;
    animatedIconPath?: string;
};

export type ShellContextSidebarConfig = {
    title: ReactNode;
    breadcrumb?: string;
    nav?: ShellContextNavItem[];
    activeNav?: string;
    onNavChange?: (key: string) => void;
    sidebarHeader?: ReactNode;
    backHref?: string;
};

type ShellContextSidebarApi = {
    setShellContextSidebar: (config: ShellContextSidebarConfig | null) => void;
};

export const ShellContextSidebarProviderContext = createContext<ShellContextSidebarApi | null>(null);

export function useShellContextSidebar(): ShellContextSidebarApi | null {
    return useContext(ShellContextSidebarProviderContext);
}

