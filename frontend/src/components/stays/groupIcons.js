// One icon per business group (utils/listingCategories.js)
import {
  BedDouble, Home, Building2, Music, Hammer, Smartphone, Sofa, Shirt, Pill,
  UtensilsCrossed, GraduationCap, Car, Sprout, Printer, Store,
} from 'lucide-react';

const GROUP_ICONS = {
  short_stays: BedDouble,
  rentals: Home,
  business: Building2,
  entertainment: Music,
  hardware: Hammer,
  electronics: Smartphone,
  home_living: Sofa,
  fashion_beauty: Shirt,
  health: Pill,
  food_drinks: UtensilsCrossed,
  schools: GraduationCap,
  auto: Car,
  agriculture: Sprout,
  business_office: Printer,
};

export const groupIcon = (groupId) => GROUP_ICONS[groupId] || Store;
