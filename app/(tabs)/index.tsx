import {ActivityIndicator, Button, StyleSheet, Text, TextInput, View} from 'react-native';
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
        fund,
        transfer,
        refreshBalance,
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

    let content;
    if (isInitialized) {
        if (starknetAccount) {
            content = <AccountView
                starknetAccount={starknetAccount}
                tongoAccount={tongoAccount}
                tongoAccountState={tongoAccountState}
                isDeployed={isDeployed}
                onPressDelete={() => {
                    void nuke();
                }}
                onPressRefreshBalance={() => {
                    void refreshBalance();
                }}
                onPressDeploy={() => {
                    void deployStarknetAccount();
                }}
                onPressAssociate={() => {
                    void associateTongoAccount();
                }}
                onPressFund={(amount) => {
                    void fund(amount);
                }}
                onPressTransfer={(amount, address) => {
                    void transfer(amount, address);
                }}
            />
        } else {
            content = <View style={styles.restoreAccountContainer}>
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
