import {Pressable, StyleSheet, Text, View} from "react-native";
import {Address} from "node:cluster";
import {useEffect, useState} from "react";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import * as Clipboard from 'expo-clipboard'

export type AddressViewProps = {
    address: string;
}

export function AddressView({ address }: AddressViewProps) {
    const [displayedAddress, setDisplayedAddress] = useState("");

    useEffect(() => {
        const parts = [];
        if (address.length > 10) {
            parts.push(address.substring(0, 5));
            parts.push(address.substring(address.length - 6, address.length));
        }

        setDisplayedAddress(parts.join("..."));
    }, [address, setDisplayedAddress]);

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{displayedAddress}</Text>

            <Pressable
                onPress={() => void copyToClipboard(address)}
            >
                <Ionicons name={"copy-outline"} size={24} color={styles.text.color} />
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: "#a19f9f",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 8,
    },
    text: {
        color: "white",
    }
})
