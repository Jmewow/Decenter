import { useState, useEffect } from "react";

// Ovo sam totalno iskopirao sa interneta, ali razumem kako radi. Primeticete profesionalno koriscenje TypeScript-a. To nisam ja
export function useDebounce<T>(
  initialValue: T,
  time: number
): [T, T, React.Dispatch<T>] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setDebouncedValue(value);
    }, time);
    return () => {
      clearTimeout(debounce);
    };
  }, [value, time]);

  return [debouncedValue, value, setValue];
}
