import { Contact } from "@/types";

export interface ContactRepository {
  getContacts(): Promise<Contact[]>;
  getContactById(id: string): Promise<Contact | null>;
  createContact(contact: Omit<Contact, "id" | "createdAt">): Promise<Contact>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact>;
  deleteContact(id: string): Promise<boolean>;
  searchContacts(query: string): Promise<Contact[]>;
}

const STORAGE_KEY = "infiplus_contacts_v1";

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "cnt-1",
    name: "Sarah Jenkins",
    email: "sarah.j@infiplus.in",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "Lead Product Designer",
    department: "Design",
    company: "Infiplus Tech",
    status: "online",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cnt-2",
    name: "Michael Chang",
    email: "michael.c@infiplus.in",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    role: "Staff Infrastructure Engineer",
    department: "Engineering",
    company: "Infiplus Tech",
    status: "in-meeting",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cnt-3",
    name: "Elena Rostova",
    email: "elena.r@infiplus.in",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "VP of Operations",
    department: "Executive",
    company: "Infiplus Global",
    status: "offline",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cnt-4",
    name: "Marcus Vance",
    email: "marcus.v@partner.io",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "Solutions Architect",
    department: "External Partner",
    company: "CloudScale Systems",
    status: "busy",
    createdAt: new Date().toISOString(),
  }
];

export class LocalContactRepository implements ContactRepository {
  private getStorage(): Contact[] {
    if (typeof window === "undefined") return DEFAULT_CONTACTS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONTACTS));
      return DEFAULT_CONTACTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CONTACTS;
    }
  }

  private saveStorage(contacts: Contact[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }

  async getContacts(): Promise<Contact[]> {
    return this.getStorage();
  }

  async getContactById(id: string): Promise<Contact | null> {
    return this.getStorage().find(c => c.id === id) || null;
  }

  async createContact(data: Omit<Contact, "id" | "createdAt">): Promise<Contact> {
    const list = this.getStorage();
    const newContact: Contact = {
      ...data,
      id: "cnt-" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newContact);
    this.saveStorage(list);
    return newContact;
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const list = this.getStorage();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Contact not found");
    list[index] = { ...list[index], ...updates };
    this.saveStorage(list);
    return list[index];
  }

  async deleteContact(id: string): Promise<boolean> {
    const list = this.getStorage();
    const filtered = list.filter(c => c.id !== id);
    this.saveStorage(filtered);
    return filtered.length !== list.length;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const list = this.getStorage();
    const q = query.toLowerCase();
    return list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) || 
      c.role?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q)
    );
  }
}
