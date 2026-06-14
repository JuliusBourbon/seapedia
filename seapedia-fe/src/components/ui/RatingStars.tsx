import { View, Text, TouchableOpacity } from "react-native";

interface RatingStarsProps {
    rating: number;
    max?: number;
    size?: number;
    interactive?: boolean;
    onRate?: (rating: number) => void;
}

export default function RatingStars({
    rating,
    max = 5,
    size = 16,
    interactive = false,
    onRate,
}: RatingStarsProps) {
    return (
        <View className="flex-row items-center gap-0.5">
            {Array.from({ length: max }).map((_, i) => {
                const filled = i < Math.round(rating);
                const star = filled ? "★" : "☆";
                const color = filled ? "#f59e0b" : "#d1d5db";

                if (interactive && onRate) {
                    return (
                        <TouchableOpacity key={i} onPress={() => onRate(i + 1)}>
                            <Text style={{ fontSize: size, color }}>{star}</Text>
                        </TouchableOpacity>
                    );
                }

                return (
                    <Text key={i} style={{ fontSize: size, color }}>
                        {star}
                    </Text>
                );
            })}
        </View>
    );
}