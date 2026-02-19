import {
  useState,
  useRef,
  useEffect,
  createElement,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
  type Key,
} from "react";
import { PresenceContext, type PresenceContextValue } from "./PresenceContext";

interface AnimatePresenceProps {
  children?: ReactNode;
  /**
   * If `true`, `AnimatePresence` will only render one component
   * at a time. The exiting component will finish its exit animation
   * before the entering component is rendered.
   *
   * @default "sync"
   */
  mode?: "sync" | "wait";
  /**
   * Fires when all exiting children have finished animating out.
   */
  onExitComplete?: () => void;
  /**
   * Custom data to pass to exiting children via the presence context.
   */
  custom?: unknown;
}

interface ChildEntry {
  key: Key;
  element: ReactElement;
  isPresent: boolean;
}

function getChildKey(child: ReactElement): Key {
  return child.key ?? "";
}

function getValidChildren(children: ReactNode): ReactElement[] {
  const result: ReactElement[] = [];
  const childArray = Array.isArray(children) ? children : [children];
  for (const child of childArray) {
    if (isValidElement(child)) {
      result.push(child);
    }
  }
  return result;
}

export function AnimatePresence({
  children,
  mode = "sync",
  onExitComplete,
  custom,
}: AnimatePresenceProps) {
  const validChildren = getValidChildren(children);
  const [entries, setEntries] = useState<ChildEntry[]>(() =>
    validChildren.map((child) => ({
      key: getChildKey(child),
      element: child,
      isPresent: true,
    })),
  );

  const exitingCount = useRef(0);
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;

  // Track whether we're waiting for exits to complete (for mode="wait")
  const [isWaiting, setIsWaiting] = useState(false);
  const pendingChildrenRef = useRef<ReactElement[] | null>(null);

  useEffect(() => {
    const currentKeys = new Set(validChildren.map(getChildKey));
    const prevKeys = new Set(entries.map((e) => e.key));

    // Find new children to add
    const entering = validChildren.filter((c) => !prevKeys.has(getChildKey(c)));
    // Find children to remove
    const exitingKeys = new Set(
      entries
        .filter((e) => e.isPresent && !currentKeys.has(e.key))
        .map((e) => e.key),
    );

    if (exitingKeys.size === 0 && entering.length === 0) {
      // Just update existing children elements
      setEntries((prev) =>
        prev.map((entry) => {
          const updated = validChildren.find(
            (c) => getChildKey(c) === entry.key,
          );
          return updated ? { ...entry, element: updated } : entry;
        }),
      );
      return;
    }

    if (mode === "wait" && exitingKeys.size > 0 && entering.length > 0) {
      // Store pending children, mark exits, wait for them to complete
      pendingChildrenRef.current = validChildren;
      setIsWaiting(true);
      exitingCount.current = exitingKeys.size;

      setEntries((prev) =>
        prev.map((entry) =>
          exitingKeys.has(entry.key)
            ? { ...entry, isPresent: false }
            : entry,
        ),
      );
      return;
    }

    exitingCount.current = exitingKeys.size;

    setEntries((prev) => {
      // Update existing, mark exiting
      const updated = prev.map((entry) => {
        if (exitingKeys.has(entry.key)) {
          return { ...entry, isPresent: false };
        }
        const updatedChild = validChildren.find(
          (c) => getChildKey(c) === entry.key,
        );
        return updatedChild ? { ...entry, element: updatedChild } : entry;
      });

      // Add entering children
      const newEntries = entering.map((child) => ({
        key: getChildKey(child),
        element: child,
        isPresent: true,
      }));

      return [...updated, ...newEntries];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  const handleSafeToRemove = (key: Key) => {
    setEntries((prev) => prev.filter((entry) => entry.key !== key));
    exitingCount.current--;

    if (exitingCount.current <= 0) {
      onExitCompleteRef.current?.();

      // If in wait mode and we have pending children, add them now
      if (isWaiting && pendingChildrenRef.current) {
        const pending = pendingChildrenRef.current;
        pendingChildrenRef.current = null;
        setIsWaiting(false);

        setEntries((prev) => {
          const remaining = prev; // exiting ones already filtered out above
          const currentKeys = new Set(remaining.map((e) => e.key));
          const newEntries = pending
            .filter((c) => !currentKeys.has(getChildKey(c)))
            .map((child) => ({
              key: getChildKey(child),
              element: child,
              isPresent: true,
            }));

          // Update existing entries with new elements
          const updated = remaining.map((entry) => {
            const updatedChild = pending.find(
              (c) => getChildKey(c) === entry.key,
            );
            return updatedChild ? { ...entry, element: updatedChild } : entry;
          });

          return [...updated, ...newEntries];
        });
      }
    }
  };

  return entries.map((entry) => {
    const contextValue: PresenceContextValue = {
      isPresent: entry.isPresent,
      safeToRemove: () => handleSafeToRemove(entry.key),
      custom,
    };

    return createElement(
      PresenceContext.Provider,
      { key: entry.key, value: contextValue },
      cloneElement(entry.element),
    );
  });
}
