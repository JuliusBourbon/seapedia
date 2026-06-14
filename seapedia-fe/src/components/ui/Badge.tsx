import { View, Text } from "react-native";

interface BadgeProps {
    label: string;
    color?: string; // hex color untuk background
    textColor?: string;
}

export default function Badge({
    label,
    color = "#e0f2fe",
    textColor = "#0369a1",
}: BadgeProps) {
    return (
        <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: color }}
        >
            <Text className="text-xs font-semibold" style={{ color: textColor }}>
                {label}
            </Text>
        </View>
    );
}