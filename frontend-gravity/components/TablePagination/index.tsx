import Icon from "@/components/Icon";

type TablePaginationProps = {
    currentPage?: number;
    totalPages?: number;
};

const TablePagination = ({
    currentPage = 1,
    totalPages = 1,
}: TablePaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-between items-center mt-6 md:mt-5">
            <button
                className="btn-stroke btn-small"
                disabled={currentPage <= 1}
            >
                <Icon name="arrow-prev" />
                <span>Назад</span>
            </button>
            <div className="text-sm font-bold">
                Страница {currentPage} из {totalPages}
            </div>
            <button
                className="btn-stroke btn-small"
                disabled={currentPage >= totalPages}
            >
                <span>Вперёд</span>
                <Icon name="arrow-next" />
            </button>
        </div>
    );
};

export default TablePagination;
