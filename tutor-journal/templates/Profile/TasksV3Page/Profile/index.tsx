import Image from "@/components/Image";
import Icon from "@/components/Icon";

const teammembers = [
    "/images/avatars/avatar-1.jpg",
    "/images/avatars/avatar-2.jpg",
    "/images/avatars/avatar-3.jpg",
    "/images/avatars/avatar-4.jpg",
];

const images = [
    "/images/screenshot-sm-1.jpg",
    "/images/screenshot-sm-2.jpg",
    "/images/screenshot-sm-3.jpg",
    "/images/screenshot-sm-4.jpg",
];

const skills = [
    "Business",
    "User Experience",
    "Interface Design",
    "Marketing",
    "Development",
    "Founder",
];

type ProfileProps = {};

const Profile = ({}: ProfileProps) => (
    <>
        <div className="mb-8">
            <div className="mb-3 text-h6">Teammembers</div>
            <div className="flex items-center">
                {teammembers.map((member, index) => (
                    <div className="relative w-9 h-9 mr-1.5" key={index}>
                        <Image
                            className="object-cover rounded-full"
                            src={member}
                            fill
                            alt="Avatar"
                        />
                    </div>
                ))}
                <button className="btn-transparent-dark btn-square btn-small">
                    <Icon name="add-circle" />
                </button>
            </div>
        </div>
        <div className="mb-8">
            <div className="mb-3 text-h6">Latest media</div>
            <div className="flex flex-wrap -mt-2 -mx-1">
                {images.map((image, index) => (
                    <div
                        className="w-[calc(50%-0.5rem)] mt-2 mx-1 border border-n-1"
                        key={index}
                    >
                        <Image
                            className="w-full object-cover"
                            src={image}
                            width={114}
                            height={85}
                            alt="Avatar"
                        />
                    </div>
                ))}
            </div>
        </div>
        <div>
            <div className="mb-3 text-h6">Skills</div>
            <div className="flex flex-wrap -mt-1.5 -ml-1">
                {skills.map((skill, index) => (
                    <div className="label-stroke mt-1.5 ml-1" key={index}>
                        {skill}
                    </div>
                ))}
            </div>
        </div>
    </>
);

export default Profile;
