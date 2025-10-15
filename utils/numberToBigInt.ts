function numberToBigInt(amount: number, decimals: number): bigint {
    const [integerPart, fractionalPart = ''] = amount.toString().split(".");

    // 2. Pad the fractional part to the required number of decimals
    const paddedFractionalPart = fractionalPart.padEnd(decimals, '0');

    // 3. Combine parts and slice to ensure correct length
    const totalString = integerPart + paddedFractionalPart.slice(0, decimals);

    // 4. Convert the final integer string to BigInt
    return BigInt(totalString);
}

export default numberToBigInt;