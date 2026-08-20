import { Droplet, Wind, type LucideIcon } from "lucide-react";
import type { FuelId } from "@/lib/fuel";

export const FUEL_ICON: Record<FuelId, LucideIcon> = {
  PETROL: Droplet,
  DIESEL: Droplet,
  CNG: Wind,
};
