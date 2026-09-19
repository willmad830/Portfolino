import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSyncExternalStore } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EMPTY_SUBSCRIBE = () => () => {};

export function useIsClient() {
  return useSyncExternalStore(EMPTY_SUBSCRIBE, () => true, () => false);
}