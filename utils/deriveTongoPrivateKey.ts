import { AccountInterface, TypedData, hash } from "starknet";

const CURVE_ORDER = BigInt('0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f');

async function deriveTongoPrivateKey(account: AccountInterface): Promise<bigint> {
    const accountAddress = account.address;
    const chainId = (account as any).chainId || 'SN_SEPOLIA';

    // Create typed data for signing
    const typedData: TypedData = {
        domain: {
            name: 'Tongo Key Derivation',
            version: '1',
            chainId: chainId,
        },
        types: {
            StarkNetDomain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'felt' },
            ],
            Message: [
                { name: 'action', type: 'felt' },
                { name: 'wallet', type: 'felt' },
            ],
        },
        primaryType: 'Message',
        message: {
            action: 'tongo-keygen-v1',
            wallet: accountAddress,
        },
    };

    // Sign the typed data
    const signature = await account.signMessage(typedData);

    // Extract r and s from signature
    const { r, s } = extractSignatureComponents(signature);

    // Hash using Poseidon
    const privateKeyHex = hash.computePoseidonHashOnElements([r, s]);
    let privateKey = BigInt(privateKeyHex);

    // Reduce modulo curve order
    privateKey = privateKey % CURVE_ORDER;

    // Ensure non-zero
    if (privateKey === BigInt(0)) {
        throw new Error('Derived private key is zero');
    }

    return privateKey;
}

function extractSignatureComponents(signature: any): { r: bigint; s: bigint } {
    if (Array.isArray(signature)) {
        // Argent X format: [1, 0, r, s, ...]
        if (signature.length >= 4 && BigInt(signature[0]) === BigInt(1)) {
            return {
                r: BigInt(signature[2]),
                s: BigInt(signature[3]),
            };
        }
        // Standard format: [r, s]
        if (signature.length >= 2) {
            return {
                r: BigInt(signature[0]),
                s: BigInt(signature[1]),
            };
        }
    }

    if (signature && typeof signature === 'object' && 'r' in signature && 's' in signature) {
        return {
            r: BigInt(signature.r),
            s: BigInt(signature.s),
        };
    }

    throw new Error('Invalid signature format');
}

export default deriveTongoPrivateKey;