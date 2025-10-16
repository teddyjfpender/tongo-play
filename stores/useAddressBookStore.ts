import { create } from 'zustand';
import { getStringItem, setStringItem } from '@/utils/secureStorage';

export type Contact = {
  name: string;
  address: string; // Tongo base58 public key
};

type AddressBookState = {
  contacts: Contact[];
  initialized: boolean;
  initialize: () => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  removeContact: (address: string) => Promise<void>;
  clear: () => Promise<void>;
};

const STORAGE_KEY = 'addressbook.contacts';

export const useAddressBookStore = create<AddressBookState>((set, get) => ({
  contacts: [],
  initialized: false,
  initialize: async () => {
    if (get().initialized) return;
    const raw = await getStringItem(STORAGE_KEY);
    if (raw) {
      try {
        const list = JSON.parse(raw) as Contact[];
        set({ contacts: list, initialized: true });
        return;
      } catch {}
    }
    set({ initialized: true });
  },
  addContact: async (contact: Contact) => {
    const list = get().contacts;
    const exists = list.find((c) => c.address === contact.address);
    const next = exists ? list.map((c) => (c.address === contact.address ? contact : c)) : [...list, contact];
    set({ contacts: next });
    await setStringItem(STORAGE_KEY, JSON.stringify(next));
  },
  removeContact: async (address: string) => {
    const list = get().contacts.filter((c) => c.address !== address);
    set({ contacts: list });
    await setStringItem(STORAGE_KEY, JSON.stringify(list));
  },
  clear: async () => {
    set({ contacts: [] });
    await setStringItem(STORAGE_KEY, JSON.stringify([]));
  },
}));

