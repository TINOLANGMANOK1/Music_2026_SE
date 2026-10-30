import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
    isAnyBorrowModalOpen: boolean;
    setIsAnyBorrowModalOpen: (isOpen: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAnyBorrowModalOpen, setIsAnyBorrowModalOpen] = useState(false);

    return (
        <ModalContext.Provider value={{ isAnyBorrowModalOpen, setIsAnyBorrowModalOpen }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModalContext = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModalContext must be used within a ModalProvider');
    }
    return context;
};
