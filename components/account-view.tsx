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
        tongoBalance,
        deployStarknetAccount,
        createTongoAccount,
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
        <View style={{
            gap: 8
        }}>
            <View style={{padding: 8}}>
                <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                    <Text style={{fontWeight: 'bold', fontSize: 24}}>Starknet Account</Text>

                    <Pressable onPress={() => {
                        void nuke();
                    }}>
                        <IconSymbol
                            size={24}
                            color="#808080"
                            name="trash.fill"
                        />
                    </Pressable>

                </View>

                <AddressView address={starknetAccount.address}/>
                {!!(mnemonicWords && mnemonicWords.length) && (
                    <View style={{ marginTop: 8 }}>
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
                            try {
                                await deployStarknetAccount();
                            } catch (e) {
                                console.error(e)
                            }
                            setIsDeploying(false)
                        }

                        void deploy()
                    }}/>
                )}
            </View>

            {!tongoAddress && (
                <ProgressButton
                    title={"Associate Tongo Account"}
                    isLoading={isAssociating}
                    onPress={() => {
                        const associate = async () => {
                            setIsAssociating(true)
                            try {
                                await createTongoAccount();
                            } catch (e) {
                                console.log(e)
                            }
                            setIsAssociating(false)
                        }

                        void associate()
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

            {(tongoBalance && tongoAccount) && (
                <TongoAccountView
                    style={{paddingHorizontal: 16, marginTop: 16}}
                    tokenName={"STRK"}
                    account={tongoAccount}
                />
            )}

        </View>

    );
}

export default AccountView;
