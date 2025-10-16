import {Button, StyleProp, StyleSheet, TextInput, TextStyle, View, ViewStyle} from "react-native";
import {useEffect, useState} from "react";
import {pubKeyBase58ToAffine, TongoAddress} from "@fatsolutions/tongo-sdk/src/types";

export type TongoAddressInputProps = {
    placeholder: string;
    setRecipient: (value: string) => void,
}

function TongoAddressInput({placeholder, setRecipient}: TongoAddressInputProps) {
    const [value, setValue] = useState("");
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        try {
            pubKeyBase58ToAffine(value);
            setIsValid(true);
        } catch {
            setIsValid(false);
        }
    }, [value, setIsValid]);

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={value}
                    placeholder={placeholder}
                    onChangeText={(text) => {
                        setValue(text);
                    }}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title={"Set"}
                    disabled={!isValid}
                    onPress={() => {
                        setRecipient(value)
                    }}
                />
            </View>

        </View>
    );
}

export default TongoAddressInput;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
    },
    inputContainer: {
        flex: 0.7,
        alignItems: "center",
    },
    buttonContainer: {
        flex: 0.3,
    },
    input: {
        width: "100%",
        padding: 16,
        backgroundColor: "#c9ccc9",
    },
})