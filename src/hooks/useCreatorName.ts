import { useState, useEffect } from 'react';

const CREATOR_NAME_KEY = 'creatorName';

export function useCreatorName() {
    const [creatorName, setCreatorNameState] = useState('');
    const [isNameLoaded, setIsNameLoaded] = useState(false);

    useEffect(() => {
        try {
            const storedName = localStorage.getItem(CREATOR_NAME_KEY);
            if (storedName) {
                setCreatorNameState(storedName);
            }
        } catch (e) {
            console.error("Failed to load creator name from localStorage.", e);
        } finally {
            setIsNameLoaded(true);
        }
    }, []);

    const setCreatorName = (name: string) => {
        setCreatorNameState(name);
        try {
            localStorage.setItem(CREATOR_NAME_KEY, name);
        } catch (e) {
            console.error("Failed to save creator name to localStorage.", e);
        }
    };

    return { creatorName, setCreatorName, isNameLoaded };
}
