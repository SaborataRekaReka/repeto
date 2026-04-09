import Link from "next/link";
import Icon from "@/components/Icon";

const ConnectCloud = () => (
    <div className="flex items-center justify-center grow py-20">
        <div className="w-full max-w-lg text-center">
            <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 bg-purple-3 rounded-sm dark:bg-purple-1/20">
                    <Icon
                        className="icon-24 fill-purple-1"
                        name="upload"
                    />
                </div>
            </div>
            <h2 className="mb-2 text-h3 md:text-h4">
                Подключите облачное хранилище
            </h2>
            <p className="max-w-sm mx-auto mb-8 text-sm text-n-3 dark:text-white/50">
                Материалы для учеников хранятся на Яндекс.Диске или Google
                Drive. Подключите хранилище, чтобы управлять файлами и
                делиться ими с учениками.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                    href="/settings?tab=integrations"
                    className="btn-purple btn-shadow"
                >
                    <Icon name="setup" />
                    <span>Подключить в Настройках</span>
                </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm mx-auto md:grid-cols-1">
                <div className="card p-5 text-left">
                    <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-sm bg-n-4/50 dark:bg-white/10">
                        <Icon
                            className="icon-18 dark:fill-white"
                            name="folder"
                        />
                    </div>
                    <div className="text-sm font-bold mb-1">
                        Яндекс.Диск
                    </div>
                    <div className="text-xs text-n-3 dark:text-white/50">
                        Подключите папку или корень диска через API
                    </div>
                </div>
                <div className="card p-5 text-left">
                    <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-sm bg-n-4/50 dark:bg-white/10">
                        <Icon
                            className="icon-18 dark:fill-white"
                            name="folder"
                        />
                    </div>
                    <div className="text-sm font-bold mb-1">Google Drive</div>
                    <div className="text-xs text-n-3 dark:text-white/50">
                        Подключите папку или корень диска через API
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default ConnectCloud;
