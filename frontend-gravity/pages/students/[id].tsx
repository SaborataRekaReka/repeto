import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Loader } from "@gravity-ui/uikit";
import StudentDetailPage from "@/templates/Students/StudentDetailPage";
import GravityLayout from "@/components/GravityLayout";
import { useStudent } from "@/hooks/useStudents";

const StudentDetail: NextPage = () => {
    const router = useRouter();
    const { id } = router.query as { id: string };
    const { data: student, loading, refetch } = useStudent(id);

    if (!student) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                }}
            >
                <Loader size="m" />
            </div>
        );
    }

    return (
        <GravityLayout title="Ученики" hideSidebar>
            <StudentDetailPage student={student} onRefresh={refetch} />
        </GravityLayout>
    );
};

export default StudentDetail;
