import {ActivityIndicator, Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useAccountStore} from "@/stores/useAccountStore";
import {useMnemonicStore} from "@/stores/useMnemonicStore";
import AccountView from "@/components/account-view";
import {useEffect, useMemo, useState} from "react";
import * as Clipboard from 'expo-clipboard';
import {generateMnemonicWords} from "@starkms/key-management";

export default function HomeScreen() {
    const {
        isInitialized,
        starknetAccount,
        initialize,
        restoreFromMnemonic,
    } = useAccountStore();
    const { setMnemonic, toWords, isValidMnemonic, clearMnemonic } = useMnemonicStore();
    const [restoreMnemonic, setRestoreMnemonic] = useState("");
    const words = useMemo(() => toWords(restoreMnemonic.trim()), [restoreMnemonic, toWords]);
    const wordCount = words.length;
    const allowedWordCounts = [12, 24];
    const isAllowedWordCount = allowedWordCounts.includes(wordCount);
    const isRestoreMnemonicValid = useMemo(() => isAllowedWordCount && isValidMnemonic(restoreMnemonic), [isAllowedWordCount, restoreMnemonic, isValidMnemonic]);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        if (!isInitialized) {
            void initialize()
        }
    }, [isInitialized, initialize]);

    const handleCreateWallet = () => {
        const words = generateMnemonicWords();
        setMnemonic(words);
        void restoreFromMnemonic(words, true);
    };

    const handleRestoreWallet = async () => {
        if (!isRestoreMnemonicValid) return;
        try {
            setIsRestoring(true);
            // Ensure no mnemonic remains in memory for restored wallets
            clearMnemonic();
            const parsed = toWords(restoreMnemonic);
            await restoreFromMnemonic(parsed, true);
        } finally {
            setIsRestoring(false);
        }
    };

    const handlePaste = async () => {
        const text = await Clipboard.getStringAsync();
        if (text) setRestoreMnemonic(text);
    };

    const handleClear = () => setRestoreMnemonic("");

    let content;
    if (isInitialized) {
        if (starknetAccount) {
            content = <ScrollView>
                <AccountView starknetAccount={starknetAccount} />
            </ScrollView>
        } else {
            content = (
                <View style={styles.container}>
                    <View style={styles.section}>
                        <Button onPress={handleCreateWallet} title={"Create a new wallet"} />
                    </View>

                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.orText}>or</Text>
                        <View style={styles.divider} />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Restore from recovery phrase</Text>
                        <Text style={styles.sectionHint}>Paste your 12 or 24 words. Separate by spaces.</Text>

                        <TextInput
                            style={styles.mnemonicInput}
                            value={restoreMnemonic}
                            placeholder={"twelve or twenty four words..."}
                            onChangeText={setRestoreMnemonic}
                            multiline
                            autoCapitalize="none"
                            autoCorrect={false}
                            textAlignVertical="top"
                            returnKeyType="done"
                            onSubmitEditing={handleRestoreWallet}
                        />
                        <View style={styles.inlineActions}>
                            <Pressable onPress={handlePaste} accessibilityRole="button">
                                <Text style={styles.link}>Paste</Text>
                            </Pressable>
                            {restoreMnemonic.length > 0 && (
                                <Pressable onPress={handleClear} accessibilityRole="button">
                                    <Text style={styles.link}>Clear</Text>
                                </Pressable>
                            )}
                        </View>

                        <View style={styles.validationRow}>
                            <Text style={[styles.helperText, isAllowedWordCount ? styles.ok : styles.warn]}>Words: {wordCount} {isAllowedWordCount ? '' : `(use 12 or 24)`}</Text>
                            {restoreMnemonic.length > 0 && (
                                <Text style={[styles.helperText, isRestoreMnemonicValid ? styles.ok : styles.warn]}>{isRestoreMnemonicValid ? 'Looks good' : 'Invalid phrase'}</Text>
                            )}
                        </View>

                        <Button
                            onPress={handleRestoreWallet}
                            disabled={!isRestoreMnemonicValid || isRestoring}
                            title={isRestoring ? "Restoring..." : "Restore wallet"}
                        />
                    </View>
                </View>
            )
        }
    } else {
        content = (
            <View style={{flex: 1, width: "100%", height: "100%", justifyContent: "center"}}>
                <ActivityIndicator size={"large"}/>
            </View>
        )
    }

    return (content);
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
        gap: 16,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    sectionHint: {
        color: '#666',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 4,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    orText: {
        color: '#888',
        textTransform: 'uppercase',
        fontSize: 12,
        letterSpacing: 1,
    },
    mnemonicInput: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    inlineActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 6,
        marginBottom: 6,
    },
    link: {
        color: '#007AFF',
        fontWeight: '500',
    },
    validationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    helperText: {
        fontSize: 12,
    },
    ok: { color: '#1f8b4c' },
    warn: { color: '#c0392b' },
});
