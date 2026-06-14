import { View, ActivityIndicator, Text } from "react-native";

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
}

export default function LoadingSpinner({
    message,
    fullScreen = false,
}: LoadingSpinnerProps) {
    return (
        <View
            className={`items-center justify-center gap-3 ${fullScreen ? "flex-1" : "py-12"}`}
        >
            <ActivityIndicator size="large" color="#06b6d4" />
            {message ? (
                <Text className="text-gray-500 text-sm">{message}</Text>
            ) : null}
        </View>
    );
}