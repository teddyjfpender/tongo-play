import { generateMnemonicWords, joinMnemonicWords, mnemonicToWords, validateMnemonic, wordlist } from "@starkms/key-management";
import { create } from "zustand";

export interface MnemonicState {
  mnemonicWords: string[] | null;
  setMnemonic: (words: string[]) => void;
  clearMnemonic: () => void;
  toWords: (input: string) => string[];
  isValidMnemonic: (input: string | string[]) => boolean;
  generate: () => string[];
}

export const useMnemonicStore = create<MnemonicState>((set) => ({
  mnemonicWords: null,

  setMnemonic: (words: string[]) => {
    set({ mnemonicWords: words });
  },

  clearMnemonic: () => {
    set({ mnemonicWords: null });
  },

  toWords: (input: string) => {
    return mnemonicToWords(input);
  },

  isValidMnemonic: (input: string | string[]) => {
    const words = Array.isArray(input) ? input : mnemonicToWords(input);
    const phrase = joinMnemonicWords(words);
    return validateMnemonic(phrase, wordlist);
  },

  generate: () => {
    const words = generateMnemonicWords();
    set({ mnemonicWords: words });
    return words;
  },
}));
