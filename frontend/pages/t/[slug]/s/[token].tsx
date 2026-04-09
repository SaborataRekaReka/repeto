import type { NextPage } from "next";
import { useRouter } from "next/router";
import StudentPortalPage from "@/templates/Public/StudentPortalPage";

const StudentPortal: NextPage = () => {
    const router = useRouter();
    const token = router.query.token as string | undefined;

    return <StudentPortalPage token={token} />;
};

export default StudentPortal;
