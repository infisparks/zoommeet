import { User } from "@/types";

export interface StoredUser extends User {
  passwordHash?: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<StoredUser | null>;
  create(user: Omit<StoredUser, "id" | "createdAt">): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
  list(): Promise<User[]>;
}
