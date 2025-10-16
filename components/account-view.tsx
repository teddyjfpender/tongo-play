import {Account} from "starknet";
import {Account as TongoAccount, AccountState as TongoAccountState} from "@fatsolutions/tongo-sdk";
import {Button, Pressable, Text, View} from "react-native";
import {useEffect, useState} from "react";
import {AddressView} from "@/components/address-view";
import TongoAccountView from "@/components/tongo-account-view";
import {IconSymbol} from "@/components/ui/icon-symbol";

export type AccountViewProps = {
    starknetAccount: Account;
    isDeployed: boolean;
    tongoAccount: TongoAccount | null;
    tongoAccountState: TongoAccountState | null;

    onPressDelete: () => void;
    onPressRefreshBalance: () => void;
    onPressDeploy: () => void;
    onPressAssociate: () => void;
    onPressFund: (amount: bigint) => void;
    onPressTransfer: (amount: bigint, address: string) => void;
}

function AccountView({
                         starknetAccount,
                         tongoAccount,
                         tongoAccountState,
                         isDeployed,
                         onPressDelete,
                         onPressDeploy,
                         onPressAssociate,
                         onPressFund,
                         onPressRefreshBalance,
                         onPressTransfer
                     }: AccountViewProps) {
    const [tongoAddress, setTongoAddress] = useState<string | null>(null);

    useEffect(() => {
        if (tongoAccount) {
            setTongoAddress(tongoAccount.tongoAddress());
        }
    }, [tongoAccount, setTongoAddress]);

    return (
        <View style={{
            gap: 16
        }}>
            <View style={{padding: 8}}>
                <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                    <Text style={{fontWeight: 'bold', fontSize: 24}}>Starknet Account</Text>

                    <Pressable onPress={onPressDelete}>
                        <IconSymbol
                            size={24}
                            color="#808080"
                            name="trash.fill"
                        />
                    </Pressable>

                </View>

                <AddressView address={starknetAccount.address}/>

                {!isDeployed && (
                    <Button title={"Deploy"} onPress={onPressDeploy}/>
                )}
            </View>

            {!tongoAddress && (
                <Button
                    title={"Associate Tongo Account"}
                    onPress={onPressAssociate}
                />
            )}

            {(tongoAccountState && tongoAccount) && (
                <TongoAccountView
                    style={{paddingHorizontal: 16}}
                    tokenName={"STRK"}
                    account={tongoAccount}
                    state={tongoAccountState}
                    onRefreshBalance={onPressRefreshBalance}
                    onFund={onPressFund}
                    onTransfer={onPressTransfer}
                />
            )}

        </View>

    );
}

export default AccountView;