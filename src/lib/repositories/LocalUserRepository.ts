import { User } from "@/types";
import { StoredUser, UserRepository } from "./UserRepository";

const STORAGE_KEY = "infiplus_users_v1";

const DEFAULT_USERS: StoredUser[] = [
  {
    id: "user-demo-1",
    name: "Alex Morgan",
    email: "alex@firstoptionagency.com",
    passwordHash: "password123",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    company: "First Option Agency",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-demo-2",
    name: "David Chen",
    email: "david@firstoptionagency.com",
    passwordHash: "password123",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    company: "First Option Agency",
    createdAt: new Date().toISOString(),
  }
];

export class LocalUserRepository implements UserRepository {
  private getStorage(): StoredUser[] {
    if (typeof window === "undefined") return DEFAULT_USERS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS;
    }
  }

  private saveStorage(users: StoredUser[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  async findById(id: string): Promise<User | null> {
    const users = this.getStorage();
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    const users = this.getStorage();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async create(userData: Omit<StoredUser, "id" | "createdAt">): Promise<User> {
    const users = this.getStorage();
    const newUser: StoredUser = {
      ...userData,
      id: "usr-" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveStorage(users);
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const users = this.getStorage();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    users[index] = { ...users[index], ...updates };
    this.saveStorage(users);
    const { passwordHash: _, ...safeUser } = users[index];
    return safeUser;
  }

  async delete(id: string): Promise<boolean> {
    const users = this.getStorage();
    const filtered = users.filter(u => u.id !== id);
    this.saveStorage(filtered);
    return filtered.length !== users.length;
  }

  async list(): Promise<User[]> {
    const users = this.getStorage();
    return users.map(({ passwordHash: _, ...u }) => u);
  }
}
