import * as Crypto from "expo-crypto";

const randomHex = (length: number): string => {
    try {
        const randomBytes = new Uint8Array(length / 2);
        Crypto.getRandomValues(randomBytes);
        return Array.from(randomBytes, (byte) =>
            byte.toString(16).padStart(2, "0"),
        ).join("");
    } catch (error) {
        console.error("Crypto session error:", error);
        throw new Error(
            "Failed to generate random bytes - crypto session not available",
        );
    }
}

export default randomHex;