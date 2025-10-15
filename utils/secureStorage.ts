import * as SecureStore from 'expo-secure-store';

// Cross-platform string storage with SecureStore on native and localStorage on web.
export async function getStringItem(key: string): Promise<string | null> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      return await SecureStore.getItemAsync(key);
    }
  } catch {}

  const ls = typeof globalThis !== 'undefined' ? (globalThis as any).localStorage : undefined;
  if (ls) {
    try {
      return ls.getItem(key);
    } catch {}
  }
  return null;
}

export async function setStringItem(key: string, value: string): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch {}

  const ls = typeof globalThis !== 'undefined' ? (globalThis as any).localStorage : undefined;
  if (ls) {
    try {
      ls.setItem(key, value);
      return;
    } catch {}
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch {}

  const ls = typeof globalThis !== 'undefined' ? (globalThis as any).localStorage : undefined;
  if (ls) {
    try {
      ls.removeItem(key);
      return;
    } catch {}
  }
}
