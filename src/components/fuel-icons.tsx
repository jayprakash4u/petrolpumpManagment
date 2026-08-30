import { Droplet, Wind, Fuel, type LucideIcon } from "lucide-react";

export const FUEL_ICON: Record<string, LucideIcon> = {
  PETROL: Droplet,
  DIESEL: Droplet,
  CNG: Wind,
  OTHER: Fuel,
};
