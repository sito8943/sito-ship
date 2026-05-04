import { useContext } from "react";
import { ShipBuilderContext } from "../../providers/ShipBuilderProvider";

export const useShipBuilder = () => {
  const context = useContext(ShipBuilderContext);

  if (!context) {
    throw new Error("useShipBuilder must be used within ShipBuilderProvider");
  }

  return context;
};
