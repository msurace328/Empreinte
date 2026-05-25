'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Admin' | 'MembershipDirector' | 'FrontDesk' | 'Auditor' | 'Member';

interface User {
    id: string;
    name: string;
    role: UserRole;
    email: string;
}

interface AuthContextType {
    user: User | null;
    setRole: (role: UserRole) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_BY_ROLE: Record<UserRole, User> = {
    Admin: { id: 'u-admin', name: 'Alexander Sterling', role: 'Admin', email: 'alex@arena.com' },
    MembershipDirector: { id: 'u-director', name: 'Elena Vance', role: 'MembershipDirector', email: 'elena@arena.com' },
    FrontDesk: { id: 'u-frontdesk', name: 'Operator Seven', role: 'FrontDesk', email: 'frontdesk@arena.com' },
    Auditor: { id: 'u-auditor', name: 'Compliance Bot', role: 'Auditor', email: 'auditor@arena.com' },
    Member: { id: 'm-001', name: 'Alexander Sterling (Member)', role: 'Member', email: 'alex@sterling.com' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Default to Admin for demo
        const savedRole = (localStorage.getItem('empreinte_role') as UserRole) || 'Admin';
        setUser(USERS_BY_ROLE[savedRole]);
        setIsLoading(false);
    }, []);

    const setRole = (role: UserRole) => {
        setUser(USERS_BY_ROLE[role]);
        localStorage.setItem('empreinte_role', role);
    };

    return (
        <AuthContext.Provider value={{ user, setRole, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
