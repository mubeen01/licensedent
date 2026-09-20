import { useEffect, useState } from 'react';

type SetValue<T> = T | ((val: T) => T);

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  // State to store our value
  // Pass  initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    // No `window` during prerendering/SSR (PRD-01 S1.1) -- fall back to
    // initialValue there, same as the localStorage-throws case below.
    if (typeof window === 'undefined') return initialValue;
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch {
      // If error also return initialValue. PRD-006 L6: dropped the
      // console.log(error) that was shipping to production here.
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  useEffect(() => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        typeof storedValue === 'function'
          ? storedValue(storedValue)
          : storedValue;
      // Save state
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // A more advanced implementation would handle the error case.
      // PRD-006 L6: dropped the console.log(error) that was shipping to
      // production here.
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
