import {Account} from "starknet";
import {Account as TongoAccount, AccountState as TongoAccountState} from "@fatsolutions/tongo-sdk";
import {Button, Text, View} from "react-native";
import {useEffect, useState} from "react";
import {AddressView} from "@/components/address-view";
import TongoAccountView from "@/components/tongo-account-view";

export type AccountViewProps = {
    starknetAccount: Account;
    isDeployed: boolean;
    tongoAccount: TongoAccount | null;
    tongoAccountState: TongoAccountState | null;

    onPressDeploy: () => void;
    onPressAssociate: () => void;
    onPressFund: (amount: bigint) => void;
}

function AccountView({
                         starknetAccount,
                         tongoAccount,
                         tongoAccountState,
                         isDeployed,
                         onPressDeploy,
                         onPressAssociate,
                         onPressFund
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
                <Text style={{fontWeight: 'bold', fontSize: 24}}>Starknet Account</Text>
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
                    onFund={onPressFund}
                />
            )}

        </View>

    );
}

export default AccountView;