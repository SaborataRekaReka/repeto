export type CloudProvider = "yandex-disk" | "google-drive";

export type CloudConnection = {
    provider: CloudProvider;
    connected: boolean;
    rootPath: string;
    email: string;
    label: string;
    status?: "active" | "disconnected";
    fileCount?: number;
    folderCount?: number;
    sizeGb?: number;
    lastSynced?: string | null;
};

export type FileItem = {
    id: string;
    name: string;
    type: "file" | "folder";
    extension?: string;
    size?: string;
    modifiedAt: string;
    cloudProvider: CloudProvider;
    cloudUrl: string;
    parentId: string | null;
    sharedWith: string[]; // student IDs
    childrenCount?: number;
};

export type StudentFileAccess = {
    studentId: string;
    studentName: string;
    subject: string;
    filesCount: number;
    foldersCount: number;
};

export type FilesOverviewResponse = {
    cloudConnections: CloudConnection[];
    files: FileItem[];
    studentAccess: StudentFileAccess[];
};

export type CloudSyncResponse = {
    connected: boolean;
    rootPath: string;
    syncedItems: number;
    restoredShares?: number;
    removedItems?: number;
    scope?: "root" | "folder";
    folderId?: string;
    syncedAt: string;
};

export type YandexDiskSyncResponse = CloudSyncResponse;
export type GoogleDriveSyncResponse = CloudSyncResponse;
