import type { NextPage } from "next";
import dynamic from "next/dynamic";

const TutorProfilePage = dynamic(
    () => import("@/templates/TutorProfile/ProfilePage"),
    { ssr: false }
);

const Profile: NextPage = () => {
    return <TutorProfilePage />;
};

export default Profile;
