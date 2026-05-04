import { createContext } from "react";
import type { ShipBuilderContextValue } from "./types";

export const ShipBuilderContext = createContext<ShipBuilderContextValue | null>(
  null,
);
