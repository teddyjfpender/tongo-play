function formatTokenBalance(rawAmount: bigint, decimals: number) {
    let balanceStr = rawAmount.toString();

    // 1. Pad with leading zeros if the total amount is less than 1 STRK
    // The total length should be at least (decimals + 1) to include a leading '0.'
    const requiredLength = decimals + 1;
    balanceStr = balanceStr.padStart(requiredLength, '0');

    // 2. Determine the position of the decimal point
    const decimalIndex = balanceStr.length - decimals;

    // 3. Insert the decimal point and remove unnecessary trailing zeros
    const integerPart = balanceStr.slice(0, decimalIndex) || '0';
    const fractionalPart = balanceStr.slice(decimalIndex).replace(/0+$/, ''); // Remove trailing zeros

    // 4. Combine parts
    if (fractionalPart.length === 0) {
        return integerPart; // Return as a whole number if no fractional part remains
    }

    return `${integerPart}.${fractionalPart}`;
}

export default formatTokenBalance;