import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import {useAccountStore} from "@/stores/useAccountStore";
import AccountView from "@/components/account-view";
import {useEffect, useState} from "react";
import isValidPrivateKey from "@/utils/isValidPrivateKey";

export default function HomeScreen() {
    const {
        isInitialized,
        starknetAccount,
        tongoAccount,
        tongoAccountState,
        isDeployed,
        initialize,
        createStarknetAccount,
        restoreStarknetAccount,
        deployStarknetAccount,
        associateTongoAccount,
        nuke
    } = useAccountStore();
    const [restorePrivateKey, setRestorePrivateKey] = useState("");
    const [isPrivateKeyValid, setIsPrivateKeyValid] = useState(false);

    useEffect(() => {
        if (!isInitialized) {
            void initialize()
        }
    }, [isInitialized, initialize]);

    useEffect(() => {
        setIsPrivateKeyValid(isValidPrivateKey(restorePrivateKey))
    }, [restorePrivateKey]);

    return (
        <View style={styles.homeContainer}>
            <View style={styles.accountContainer}>
                {starknetAccount !== null ? (
                    <AccountView
                        starknetAccount={starknetAccount}
                        tongoAccount={tongoAccount}
                        tongoAccountState={tongoAccountState}
                        isDeployed={isDeployed}
                        onPressDeploy={() => {
                            void deployStarknetAccount()
                        }}
                        onPressAssociate={() => {
                            void associateTongoAccount()
                        }}
                    />
                ) : (
                    <View style={styles.restoreAccountContainer}>
                        <Button
                            onPress={createStarknetAccount}
                            title={"Create a new account"}
                        />
                        <Text>--OR--</Text>
                        <TextInput
                            style={styles.restorePrivateKeyField}
                            value={restorePrivateKey}
                            placeholder={"0xprivatekey"}
                            onChangeText={setRestorePrivateKey}
                        />
                        <Button
                            onPress={() => {
                                void restoreStarknetAccount(restorePrivateKey)
                            }}
                            disabled={!isPrivateKeyValid}
                            title={"Restore account"}
                        />
                    </View>
                )}
            </View>

            {starknetAccount !== null && (
                <Button
                    title={"Remove Account"}
                    onPress={nuke}/>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    homeContainer: {
        flex: 1,
    },
    accountContainer: {
        flex: 1
    },
    restoreAccountContainer: {
        alignItems: "center",
        gap: 16
    },
    restorePrivateKeyField: {
        width: "80%",
        borderWidth: 1,
    },
});
