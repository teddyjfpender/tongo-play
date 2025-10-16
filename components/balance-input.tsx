import {Button, StyleSheet, Text, TextInput, View} from "react-native";
import {useState} from "react";
import {ProgressButton} from "@/components/progress-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type BalanceInputProps = {
    placeholder?: string;
    tokenName: string;
    action: string;
    isLoading: boolean;
    onAction: (balance: number) => void;
    variant?: 'soft' | 'outlined';
    showAction?: boolean;
    onValueChange?: (value: number | null) => void;
    value?: number | null;
}

function BalanceInput({placeholder, tokenName, action, isLoading, onAction, variant = 'soft', showAction = true, onValueChange, value}: BalanceInputProps) {
    const [balanceText, setBalanceText] = useState("");
    const theme = useColorScheme() ?? 'light';
    const themeColors = Colors[theme];

    return (
        <View style={styles.container}>
            <View style={[styles.inputContainer, !showAction && { flex: 1 }]}>
                <TextInput
                    style={[
                        styles.input,
                        variant === 'soft'
                          ? { backgroundColor: (themeColors.icon as string) + '22' }
                          : { borderWidth: 1, borderColor: themeColors.icon, backgroundColor: 'transparent', borderRadius: 10 },
                    ]}
                    value={value != null ? String(value) : balanceText}
                    onChangeText={(text) => {
                        if (text.length === 0) {
                            setBalanceText("");
                            onValueChange?.(null);
                            return;
                        }
                        if (!isNaN(Number(text))) {
                            setBalanceText(text);
                            onValueChange?.(Number(text));
                        }
                    }}
                    placeholder={placeholder ?? ""}
                    keyboardType="numeric"
                />
                <Text style={[styles.tokenName, { color: themeColors.icon }]}>{tokenName}</Text>
            </View>

            <View style={[styles.buttonContainer, !showAction && { flex: 0, width: 0 }]}>
                {showAction && (
                    <ProgressButton
                        title={action}
                        isLoading={isLoading}
                        disabled={balanceText.length === 0}
                        onPress={() => {
                            let number = parseFloat(balanceText);
                            if (!isNaN(number)) {
                                setBalanceText("");
                                onAction(number);
                            }
                        }}
                    />
                )}
            </View>

        </View>
    );
}

export default BalanceInput;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
    },
    inputContainer: {
        flex: 0.7,
        alignItems: "center",
        flexDirection: "row",
    },
    tokenName: {
        position: "absolute",
        right: 16,
    },
    input: {
        width: "100%",
        paddingRight: 64,
        paddingLeft: 16,
        paddingVertical: 16,
    },
    buttonContainer: {
        flex: 0.3,
    },
})
