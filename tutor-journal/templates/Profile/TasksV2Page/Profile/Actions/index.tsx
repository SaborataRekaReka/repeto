import Icon from "@/components/Icon";

type ActionsProps = {};

const Actions = ({}: ActionsProps) => (
    <div className="flex mt-6 pt-6 border-t border-dashed border-n-1">
        <button className="btn-purple btn-medium grow dark:border-transparent">
            <Icon name="add-circle" />
            <span>Add new task</span>
        </button>
        <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
            <Icon name="email" />
        </button>
        <button className="btn-stroke btn-medium btn-square shrink-0 ml-1.5">
            <Icon name="arrow-up-right" />
        </button>
    </div>
);

export default Actions;
