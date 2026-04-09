import type { NextPage } from "next";
import { useRouter } from "next/router";
import StudentDetailPage from "@/templates/Students/StudentDetailPage";
import { useStudent } from "@/hooks/useStudents";

const StudentDetail: NextPage = () => {
    const router = useRouter();
    const { id } = router.query as { id: string };
    const { data: student, loading, refetch } = useStudent(id);

    if (!student && loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-n-3">Загрузка...</div>
            </div>
        );
    }

    return <StudentDetailPage student={student} onRefresh={refetch} />;
};

export default StudentDetail;
