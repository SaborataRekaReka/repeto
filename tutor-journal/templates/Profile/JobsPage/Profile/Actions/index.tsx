import Icon from "@/components/Icon";

type ActionsProps = {};

const Actions = ({}: ActionsProps) => (
    <div className="flex mt-6 pt-6 border-t border-dashed border-n-1 dark:border-white">
        <button className="btn-purple btn-medium grow dark:border-transparent">
            <Icon name="add-circle" />
            <span>Connect</span>
        </button>
        <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
            <Icon name="marker-horizontal" />
        </button>
    </div>
);

export default Actions;
