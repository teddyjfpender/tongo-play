const isValidPrivateKey = (key: string): boolean => {
    const cleanKey = key.startsWith("0x") ? key.slice(2) : key;
    return /^[0-9a-fA-F]{63}$/.test(cleanKey);
}

export default isValidPrivateKey;