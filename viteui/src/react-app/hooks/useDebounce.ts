import { useState, useEffect, useCallback } from 'react';
import React from 'react'; // Ensure React is imported

/**
 * Custom hook to debounce a value.
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns The debounced value.
 */
function useDebounce<T>(value: T, delay: number): T {
    // State and setters for debounced value
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(
        () => {
            // Update debounced value after delay
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            // Cancel the timeout if value changes (also on delay change or unmount)
            return () => {
                clearTimeout(handler);
            };
        },
        [value, delay] // Only re-call effect if value or delay changes
    );

    return debouncedValue;
}

/**
 * Custom hook to debounce a function call.
 * @param callback The function to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns A debounced version of the callback function.
 */
export function useDebouncedCallback<A extends any[]>(
    callback: (...args: A) => void,
    delay: number
): (...args: A) => void {
    // Corrected implementation using useRef
    const timeoutIdRef = React.useRef<NodeJS.Timeout | null>(null);
    const memoizedCallback = useCallback(callback, [callback]); // Memoize the original callback

    const debouncedCallback = useCallback(
        (...args: A) => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
            timeoutIdRef.current = setTimeout(() => {
                memoizedCallback(...args);
            }, delay);
        },
        [memoizedCallback, delay] // Dependencies
    );

     // Cleanup on unmount
     useEffect(() => {
        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, []); // Empty dependency array ensures cleanup runs only on unmount

    return debouncedCallback;
}

export default useDebounce; // Export the value debounce hook as default
