import type { NextPage } from "next";
import { useRouter } from "next/router";
import BookingPage from "@/templates/Public/BookingPage";

const BookPage: NextPage = () => {
    const router = useRouter();
    const slug = router.query.slug as string;
    if (!slug) return null;
    return <BookingPage slug={slug} />;
};

export default BookPage;
