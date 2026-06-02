// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import {
    isAuthenticated,
    isAdmin,
    getCurrentUser,
    login as loginService,
    logout as logoutService,
} from '../services/authService';
import { API_CONFIG } from '../config';

export function useAuth() {
    const [authenticated, setAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<string>('');
    const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false);

    useEffect(() => {
        if (isAuthenticated()) {
            setAuthenticated(true);
            setCurrentUser(getCurrentUser());
            setUserIsAdmin(isAdmin());
        }
    }, []);

    const login = async (username: string, password: string) => {
        await loginService(API_CONFIG.baseURL, { username, password });
        setAuthenticated(true);
        setCurrentUser(username);
        setUserIsAdmin(isAdmin());
    };

    const logout = () => {
        logoutService();
        setAuthenticated(false);
        setCurrentUser('');
        setUserIsAdmin(false);
    };

    return { authenticated, currentUser, userIsAdmin, login, logout };
}