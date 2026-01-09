
import React, { createContext, useState, useEffect, useMemo } from 'react';

interface AppContextType {
    workspaceName: string;
    setWorkspaceName: (name: string) => void;
    workspaceAvatar: string | null;
    setWorkspaceAvatar: (avatar: string | null) => void;
}

export const AppContext = createContext<AppContextType>({
    workspaceName: 'Workspace',
    setWorkspaceName: () => {},
    workspaceAvatar: null,
    setWorkspaceAvatar: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [workspaceName, setWorkspaceName] = useState(() => {
        return localStorage.getItem('workspace-name') || 'Workspace';
    });

    const [workspaceAvatar, setWorkspaceAvatar] = useState<string | null>(() => {
        return localStorage.getItem('workspace-avatar') || null;
    });

    useEffect(() => {
        localStorage.setItem('workspace-name', workspaceName);
    }, [workspaceName]);

    useEffect(() => {
        if (workspaceAvatar) {
            localStorage.setItem('workspace-avatar', workspaceAvatar);
        } else {
            localStorage.removeItem('workspace-avatar');
        }
    }, [workspaceAvatar]);

    const value = {
        workspaceName,
        setWorkspaceName,
        workspaceAvatar,
        setWorkspaceAvatar
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};