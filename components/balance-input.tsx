import {Button, StyleSheet, Text, TextInput, View} from "react-native";
import {useState} from "react";
import {ProgressButton} from "@/components/progress-button";

export type BalanceInputProps = {
    placeholder?: string;
    tokenName: string;
    action: string;
    isLoading: boolean;
    onAction: (balance: number) => void;
}

function BalanceInput({placeholder, tokenName, action, isLoading, onAction}: BalanceInputProps) {
    const [balanceText, setBalanceText] = useState("");

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={balanceText}
                    onChangeText={(text) => {
                        if (!isNaN(Number(text))) {
                            setBalanceText(text);

                            let number = parseFloat(text);
                            console.log(number);
                        }
                    }}
                    placeholder={placeholder ?? ""}
                    keyboardType="numeric"
                />
                <Text style={styles.tokenName}>{tokenName}</Text>
            </View>

            <View style={styles.buttonContainer}>
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
        backgroundColor: "#c9ccc9",
    },
    buttonContainer: {
        flex: 0.3,
    },
})