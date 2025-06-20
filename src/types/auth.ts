
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Partner Admin' | 'Vendor';
  partnerId?: string; // For Partner Admins and Vendors under a partner
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
