// Minimal WebCrypto SubtleCrypto polyfill for React Native (Expo)
// Supports only the methods used by @fatsolutions/tongo-sdk: HKDF via importKey/deriveKey/exportKey

import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';

type CryptoKeyLike = { __raw: Uint8Array };

function toUint8Array(data: ArrayBuffer | ArrayBufferView | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  // Fallback; attempt to construct
  return new Uint8Array(data as any);
}

function ensureSubtle() {
  const g: any = globalThis as any;
  if (!g.crypto) g.crypto = {};
  if (g.crypto.subtle) return;

  const subtle = {
    async importKey(
      format: string,
      keyData: ArrayBuffer | ArrayBufferView | Uint8Array,
      algorithm: string | Record<string, unknown>,
      extractable: boolean,
      keyUsages: string[]
    ): Promise<CryptoKeyLike> {
      if (format !== 'raw') throw new Error('Only raw keys supported');
      const raw = toUint8Array(keyData);
      return { __raw: raw };
    },

    async deriveKey(
      params: { name: string; hash?: string; salt: ArrayBuffer | Uint8Array; info: ArrayBuffer | Uint8Array; length?: number },
      baseKey: CryptoKeyLike,
      derivedKeyType: { name: string; hash?: string; length?: number },
      extractable: boolean,
      keyUsages: string[]
    ): Promise<CryptoKeyLike> {
      if (!params || params.name !== 'HKDF') throw new Error('Only HKDF is supported');
      const salt = toUint8Array(params.salt);
      const info = toUint8Array(params.info);
      const ikm = baseKey.__raw;
      const length = params.length ?? (derivedKeyType.length ? Math.floor(derivedKeyType.length / 8) : 32);
      const okm = hkdf(sha256, ikm, salt, info, length);
      return { __raw: okm };
    },

    async exportKey(format: string, key: CryptoKeyLike): Promise<ArrayBuffer> {
      if (format !== 'raw') throw new Error('Only raw export supported');
      const raw = key.__raw;
      return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    },
  };

  g.crypto.subtle = subtle;
}

ensureSubtle();

