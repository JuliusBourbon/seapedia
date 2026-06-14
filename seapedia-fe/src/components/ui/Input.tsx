import { View, Text, TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
    return (
        <View className="mb-4">
            {label ? (
                <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
            ) : null}
            <TextInput
                className={`border rounded-xl px-4 py-3 text-base text-gray-900 bg-white ${error ? "border-red-400" : "border-gray-300"
                    }`}
                placeholderTextColor="#9ca3af"
                {...props}
            />
            {error ? (
                <Text className="text-red-500 text-xs mt-1">{error}</Text>
            ) : null}
        </View>
    );
}