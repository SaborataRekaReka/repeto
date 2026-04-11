import { projectsDetails } from "@/mocks/projects";

type GeneralInformationProps = {};

const GeneralInformation = ({}: GeneralInformationProps) => (
    <>
        <div className="mb-auto">
            {projectsDetails.map((group) => (
                <div className="mb-10 last:mb-0" key={group.id}>
                    <div className="mb-5 text-h6">{group.title}</div>
                    <div className="flex flex-wrap -mt-4 -mx-2.5">
                        {group.items.map((item) => (
                            <div
                                className={`mt-4 mx-2.5 pb-3 border-b border-n-1 dark:border-white ${
                                    item.fullWide
                                        ? "w-[calc(100%-1.25rem)]"
                                        : "w-[calc(50%-1.25rem)] md:w-[calc(100%-1.25rem)]"
                                }`}
                                key={item.id}
                            >
                                <div className="mb-1.5 text-xs text-n-3 dark:text-white/75">
                                    {item.label}
                                </div>
                                <div className="text-sm font-bold">
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <div className="flex justify-between mt-16 md:block md:mt-10">
            <button className="btn-stroke min-w-[10.25rem] md:min-w-full md:mb-3">
                Cancel
            </button>
            <button className="btn-purple min-w-[11.7rem] md:min-w-full">
                Update Settings
            </button>
        </div>
    </>
);

export default GeneralInformation;
