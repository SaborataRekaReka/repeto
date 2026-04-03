import Icon from "@/components/Icon";

type ActionsProps = {};

const Actions = ({}: ActionsProps) => (
    <div className="flex mb-6 md:mb-5">
        <button className="btn-stroke btn-small mr-1.5 md:px-2">
            <Icon name="filters" />
            <span>All Filters</span>
        </button>
        <button className="btn-stroke btn-small mr-1.5 md:px-2">
            <Icon name="table" />
            <span>Group</span>
        </button>
        <button className="btn-stroke btn-small mr-1.5 md:px-2">
            <Icon name="sort" />
            <span>Sort</span>
        </button>
        <button className="btn-stroke btn-small btn-square">
            <Icon name="dots" />
        </button>
        <button className="btn-stroke btn-small btn-square ml-auto">
            <Icon name="search" />
        </button>
    </div>
);

export default Actions;
