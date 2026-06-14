import { View, Text } from "react-native";
import { Review } from "../../../types/api.types";
import RatingStars from "@/components/ui/RatingStars";

interface ReviewCardProps {
    review: Review;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function ReviewCard({ review }: ReviewCardProps) {
    return (
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-gray-800">{review.reviewerName}</Text>
                <Text className="text-xs text-gray-400">{formatDate(review.createdAt)}</Text>
            </View>
            <RatingStars rating={review.rating} size={14} />
            <Text className="text-gray-600 text-sm mt-2 leading-5">{review.comment}</Text>
        </View>
    );
}