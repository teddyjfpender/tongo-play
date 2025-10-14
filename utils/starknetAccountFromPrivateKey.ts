import {Account, CallData, ec, hash, Provider} from "starknet";

const starknetAccountFromPrivateKey = (
    privateKey: string,
    classHash: string,
    provider: Provider,
): Account => {
    const starknetPubKey = ec.starkCurve.getStarkKey(privateKey);

    const accountConstructorCalldata = CallData.compile({ publicKey: starknetPubKey });
    const address = hash.calculateContractAddressFromHash(
        starknetPubKey,
        classHash,
        accountConstructorCalldata,
        0
    );

    return new Account({provider, address, signer: privateKey});
}

export default starknetAccountFromPrivateKey;