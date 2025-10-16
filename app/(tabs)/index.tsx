import {ActivityIndicator, ScrollView, StyleSheet, View} from 'react-native';
import {useAccountStore} from "@/stores/useAccountStore";
import AccountView from "@/components/account-view";
import {useEffect} from "react";
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const {
        isInitialized,
        starknetAccount,
        initialize,
    } = useAccountStore();
    const router = useRouter();

    useEffect(() => {
        if (!isInitialized) {
            void initialize()
        }
    }, [isInitialized, initialize]);


    useEffect(() => {
        if (isInitialized && !starknetAccount) {
            router.replace('/onboarding');
        }
    }, [isInitialized, starknetAccount, router]);

    if (!isInitialized) {
        return (
            <View style={{flex: 1, width: "100%", height: "100%", justifyContent: "center"}}>
                <ActivityIndicator size={"large"}/>
            </View>
        );
    }

    if (!starknetAccount) {
        // In case router.replace hasn’t navigated yet, avoid flashing content
        return null;
    }

    return (
        <ScrollView>
            <AccountView starknetAccount={starknetAccount} />
        </ScrollView>
    );
}


const styles = StyleSheet.create({});
