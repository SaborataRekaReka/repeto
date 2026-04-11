import { useState } from "react";
import Comment from "@/components/Comment";
import Review from "@/components/Review";

import { reviews } from "@/mocks/reviews";

type ReviewsProps = {};

const Reviews = ({}: ReviewsProps) => {
    const [value, setValue] = useState<string>("");

    return (
        <>
            <Comment
                className="mb-6"
                avatar="/images/avatars/avatar.jpg"
                placeholder="Type to add something"
                value={value}
                setValue={(e: any) => setValue(e.target.value)}
            />
            <div>
                {reviews.map((review) => (
                    <Review item={review} key={review.id} imageBig />
                ))}
            </div>
        </>
    );
};

export default Reviews;
