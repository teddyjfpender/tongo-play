import {Account} from "starknet";
import {Button, Pressable, Text, View} from "react-native";
import {useEffect, useState} from "react";
import {AddressView} from "@/components/address-view";
import {IconSymbol} from "@/components/ui/icon-symbol";
import {useAccountStore} from "@/stores/useAccountStore";
import {useMnemonicStore} from "@/stores/useMnemonicStore";
import TongoAccountView from "@/components/tongo-account-view";
import {ProgressButton} from "@/components/progress-button";
import {useRouter} from "expo-router";
import SectionCard from "@/components/ui/section-card";
import TokenBalance from "@/components/token-balance";

export type AccountViewProps = {
    starknetAccount: Account;
}

function AccountView({starknetAccount}: AccountViewProps) {
    const [tongoAddress, setTongoAddress] = useState<string | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isAssociating, setIsAssociating] = useState(false);
    const {
        tongoAccount,
        isDeployed,
        tongoAccountState,
        deployStarknetAccount,
        associateTongoAccount,
        nuke
    } = useAccountStore();
    const { mnemonicWords } = useMnemonicStore();
    const router = useRouter();

    useEffect(() => {
        if (tongoAccount) {
            setTongoAddress(tongoAccount.tongoAddress());
        }
    }, [tongoAccount, setTongoAddress]);

    return (
        <View style={{ gap: 12, padding: 8 }}>
            <SectionCard>
                {!tongoAddress && (
                    <ProgressButton
                        title={"Associate Tongo Account"}
                        isLoading={isAssociating}
                        onPress={() => {
                            const associate = async () => {
                                setIsAssociating(true)
                                try { await associateTongoAccount(); } catch (e) { console.log(e) }
                                setIsAssociating(false)
                            }
                            void associate()
                        }}
                    />
                )}

                {(tongoAccountState && tongoAccount) && (
                    <TongoAccountView
                        style={{ paddingHorizontal: 0 }}
                        tokenName={"STRK"}
                        account={tongoAccount}
                    />
                )}
            </SectionCard>

            {/* Starknet Account summary section removed per updated design */}
        </View>
    );
}

export default AccountView;
