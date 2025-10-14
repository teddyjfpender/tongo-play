import {Account} from "starknet";
import {Button, Text, View} from "react-native";
import {useState} from "react";

export type AccountViewProps = {
    starknetAccount: Account;
    isDeployed: boolean;

    onPressDeploy: () => void;
    onPressAssociate: () => void;
}

function AccountView({starknetAccount, isDeployed, onPressDeploy, onPressAssociate}: AccountViewProps) {
    const [tongoAddress, setTongoAddress] = useState<string | null>(null);

    // useEffect(() => {
    //     if (tongoAccount) {
    //         setTongoAddress(tongoAccount.tongoAddress);
    //     }
    // }, [tongoAccount, setTongoAddress]);

    return (
        <View>
            <View>
                <Text>Starknet Account</Text>
                <Text>{starknetAccount.address}</Text>

                {!isDeployed && (
                    <Button title={"Deploy"} onPress={onPressDeploy}/>
                )}
            </View>

            {tongoAddress && (
                <View>
                    <Text>Tongo Account</Text>
                    <Text>{tongoAddress}</Text>
                </View>
            )}

            {!tongoAddress && (
                <Button
                    title={"Associate Tongo Account"}
                    onPress={onPressAssociate}
                />
            )}

        </View>

    );
}

export default AccountView;