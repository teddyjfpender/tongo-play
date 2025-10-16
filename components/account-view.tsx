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
            <SectionCard
                title="Starknet Account"
                right={
                    <Pressable onPress={() => { void nuke(); }}>
                        <IconSymbol size={24} color="#808080" name="trash.fill" />
                    </Pressable>
                }
            >
                <AddressView address={starknetAccount.address} />
                {!!(mnemonicWords && mnemonicWords.length) && (
                    <View>
                        <Button title="Backup phrase" onPress={() => router.push('/backup')} />
                    </View>
                )}
                {!isDeployed && (
                    <ProgressButton
                        title={"Deploy"}
                        isLoading={isDeploying}
                        onPress={() => {
                            const deploy = async () => {
                                setIsDeploying(true)
                                try { await deployStarknetAccount(); } catch (e) { console.error(e) }
                                setIsDeploying(false)
                            }
                            void deploy()
                        }}
                    />
                )}
                {isDeployed && (
                    <TokenBalance
                        token={"STRK"}
                        erc20Address={"0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D"}
                        accountAddress={starknetAccount.address}
                    />
                )}
            </SectionCard>

            <SectionCard title="Confidential (STRK)">
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
        </View>
    );
}

export default AccountView;
