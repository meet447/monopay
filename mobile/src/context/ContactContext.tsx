import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

export type Contact = {
  address: string;
  name: string;
  lastPaid?: number;
};

type ContactContextState = {
  contacts: Contact[];
  saveContact: (address: string, name: string) => Promise<void>;
  getContactName: (address: string) => string;
  frequentPayees: Contact[];
};

const ContactContext = createContext<ContactContextState | undefined>(undefined);

const CONTACTS_KEY = 'solupi_contacts';

export function ContactProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    async function loadContacts() {
      const saved = await SecureStore.getItemAsync(CONTACTS_KEY);
      if (saved) setContacts(JSON.parse(saved));
    }
    loadContacts();
  }, []);

  const saveContact = useCallback(async (address: string, name: string) => {
    setContacts(prev => {
      const filtered = prev.filter(c => c.address !== address);
      const updated = [{ address, name, lastPaid: Date.now() }, ...filtered];
      SecureStore.setItemAsync(CONTACTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getContactName = useCallback((address: string) => {
    const contact = contacts.find(c => c.address === address);
    if (contact) return contact.name;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [contacts]);

  const frequentPayees = contacts.slice(0, 5); // Simple frequent payees logic

  return (
    <ContactContext.Provider value={{ contacts, saveContact, getContactName, frequentPayees }}>
      {children}
    </ContactContext.Provider>
  );
}

export const useContacts = () => {
  const context = useContext(ContactContext);
  if (!context) throw new Error('useContacts must be used within ContactProvider');
  return context;
};
