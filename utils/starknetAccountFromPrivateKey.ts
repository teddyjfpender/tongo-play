import { Account, Provider } from "starknet";
import { AccountDerivationConfig, deriveAccountAddress, getStarknetPublicKeyFromPrivate } from "@starkms/key-management";

const starknetAccountFromPrivateKey = (
    privateKey: string,
    classHash: string,
    provider: Provider,
): Account => {
    // Use compressed public key (x-coordinate only)
    const publicKey = getStarknetPublicKeyFromPrivate(privateKey, true);

    const config: AccountDerivationConfig = {
        classHash,
        salt: "0x0",
    };

    const derivedInfo = deriveAccountAddress(publicKey, config);
    const address = derivedInfo.address;

    return new Account({ provider, address, signer: privateKey });
}

export default starknetAccountFromPrivateKey;
