import { createContext } from 'react';

// undefined means no host; null means the host's native ref is not ready yet.
export const SharedElementHostContext = createContext<
  number | null | undefined
>(undefined);
