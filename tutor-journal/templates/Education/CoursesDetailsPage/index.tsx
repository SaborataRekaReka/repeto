import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import Details from "./Details";

const responsibilities = [
    "These hands on components will let you apply",
    "Projects will incorporate topics such as Google Cloud Platform",
    "You can expect to gain practical hands-on experience",
];

const skills = ["Business", "Marketing", "Development", "Entrepreneur", "HTML"];

const list = [
    "Identify the purpose and value of Google Cloud Platform products and services",
    "Implement federated identity management using Firebase authentication",
    "Deploy applications using Container Builder, Container Registry, and Deployment Manager",
];

const career = [
    {
        content: "Started a new career after completing courses",
        progressValue: 30,
    },
    {
        content: "Got a tangible career benefit from this course",
        progressValue: 65,
        progressColor: "#98E9AB",
    },
];

const CoursesDetailsPage = () => {
    return (
        <Layout title="Course details" background back>
            <div className="flex pt-4 lg:block">
                <div className="shrink-0 w-[21rem] mr-20 4xl:w-[16.5rem] xl:mr-10 lg:w-full lg:mb-10">
                    <Details />
                </div>
                <div className="card grow">
                    <div className="card-title">About this specialization</div>
                    <div className="pt-6 px-5 pb-8">
                        <div className="mb-2 font-bold">Overview:</div>
                        <div className="text-sm">
                            In this specialization, application developers learn
                            how to design, develop, and deploy applications that
                            seamlessly integrate managed services from the
                            Google Cloud Platform (GCP). Through a combination
                            of presentations, demos, and hands-on labs,
                            participants learn how to use GCP services and
                            pre-trained machine learning APIs to build secure,
                            scalable, and intelligent cloud-native applications.
                            Learners can choose to complete labs in their
                            favorite language: Node.js, Java, or Python. This
                            class is intended for application developers who
                            want to build cloud-native applications.
                        </div>
                        <div className="mt-6 pt-6 border-t border-dashed border-n-1 dark:border-white">
                            <div className="mb-2 font-bold">
                                Responsibilities:
                            </div>
                            <div>
                                {responsibilities.map((item, index) => (
                                    <div
                                        className="relative pl-4 text-sm before:absolute before:top-2 before:left-0 before:w-1 before:h-1 before:bg-n-1 dark:before:bg-white"
                                        key={index}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <button className="group inline-flex items-center mt-3 text-xs font-bold transition-colors hover:text-purple-1">
                                <Icon
                                    className="mr-1.5 transition-colors dark:fill-white group-hover:fill-purple-1"
                                    name="dots"
                                />
                                See more
                            </button>
                        </div>
                        <div className="mt-6 pt-6 border-t border-dashed border-n-1 dark:border-white">
                            <div className="mb-2 font-bold">
                                Skills you will learn:
                            </div>
                            <div className="text-sm">
                                Through a combination of presentations, demos,
                                and hands-on labs, participants learn how to use
                                GCP services and pre-trained machine learning
                                APIs to build secure, scalable, and intelligent
                                cloud-native applications.
                            </div>
                            <div className="flex flex-wrap mt-2 -ml-1">
                                {skills.map((skill, index) => (
                                    <div
                                        className="label-black mt-1 ml-1"
                                        key={index}
                                    >
                                        {skill}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-dashed border-n-1 dark:border-white">
                            <div className="mb-5 font-bold">
                                What you will learn:
                            </div>
                            <div>
                                {list.map((item, index) => (
                                    <div
                                        className="flex items-start mb-3 pb-3 border-b border-n-1/40 text-sm last:mb-0 last:pb-0 last:border-none dark:border-white/40"
                                        key={index}
                                    >
                                        <div className="flex justify-center items-center shrink-0 w-5 h-5 mr-2.5 bg-green-1">
                                            <Icon
                                                className="fill-white"
                                                name="check"
                                            />
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-dashed border-n-1 dark:border-white">
                            <div className="mb-2 font-bold">
                                Learner career outcomes:
                            </div>
                            <div className="mb-6 text-sm">
                                Demos, and hands-on labs, participants learn how
                                to use GCP services and pre-trained machine
                                learning APIs to build secure, scalable, and
                                cloud-native applications.{" "}
                            </div>
                            <div className="flex flex-wrap -mt-10 -mx-5 md:-mt-6">
                                {career.map((item, index) => (
                                    <div
                                        className="w-[calc(50%-2.5rem)] mt-10 mx-5 md:w-[calc(100%-2.5rem)] md:mt-6"
                                        key={index}
                                    >
                                        <div
                                            className="relative h-1.5 mb-4 bg-yellow-1"
                                            style={{
                                                backgroundColor:
                                                    item.progressColor,
                                            }}
                                        >
                                            <div
                                                className="absolute top-0 left-0 bottom-0 bg-n-1/30"
                                                style={{
                                                    width:
                                                        item.progressValue +
                                                        "%",
                                                }}
                                            ></div>
                                        </div>
                                        <div className="flex">
                                            <div className="grow text-sm font-medium">
                                                {item.content}
                                            </div>
                                            <div className="shrink-0 ml-10 font-bold">
                                                {item.progressValue}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CoursesDetailsPage;
