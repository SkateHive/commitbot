import { useWindowSize } from "./use-window-size"

/**
 * Returns true if the window width is less than 768px (mobile breakpoint)
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const { width } = useWindowSize()
  return width > 0 && width < breakpoint
}
