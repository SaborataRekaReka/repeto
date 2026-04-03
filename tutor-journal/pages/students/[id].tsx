import type { GetServerSideProps, NextPage } from "next";
import StudentDetailPage from "@/templates/Students/StudentDetailPage";
import { students } from "@/mocks/students";
import type { Student } from "@/types/student";

type Props = {
    student: Student;
};

const StudentDetail: NextPage<Props> = ({ student }) => {
    return <StudentDetailPage student={student} />;
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
    const { id } = context.params as { id: string };
    const student = students.find((s) => s.id === id);

    if (!student) {
        return { notFound: true };
    }

    return { props: { student } };
};

export default StudentDetail;
