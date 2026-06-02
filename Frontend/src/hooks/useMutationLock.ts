import { useCallback, useRef, useState } from 'react';

export function useMutationLock<T extends (...args: never[]) => Promise<unknown>>(fn: T) {
    const [loading, setLoading] = useState(false);
    const lockRef = useRef(false);

    const run = useCallback(
        async (...args: Parameters<T>) => {
            if (lockRef.current) return;
            lockRef.current = true;
            setLoading(true);
            try {
                return await fn(...args);
            } finally {
                lockRef.current = false;
                setLoading(false);
            }
        },
        [fn],
    ) as (...args: Parameters<T>) => ReturnType<T> | undefined;

    return { run, loading };
}
