import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: "primary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

export default function Button({
    label,
    onPress,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    fullWidth = false,
}: ButtonProps) {
    const base = "rounded-xl flex-row items-center justify-center";

    const sizeClass = {
        sm: "px-3 py-2",
        md: "px-5 py-3",
        lg: "px-6 py-4",
    }[size];

    const variantClass = {
        primary: "bg-sea-500",
        outline: "border border-sea-500 bg-transparent",
        ghost: "bg-transparent",
        danger: "bg-red-500",
    }[variant];

    const textClass = {
        primary: "text-white font-semibold",
        outline: "text-sea-600 font-semibold",
        ghost: "text-sea-600 font-semibold",
        danger: "text-white font-semibold",
    }[variant];

    const textSize = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
    }[size];

    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            className={`${base} ${sizeClass} ${variantClass} ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-50" : ""}`}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === "outline" || variant === "ghost" ? "#0891b2" : "#fff"}
                    className="mr-2"
                />
            ) : null}
            <Text className={`${textClass} ${textSize}`}>{label}</Text>
        </TouchableOpacity>
    );
}