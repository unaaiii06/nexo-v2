import {
  Briefcase, GraduationCap, HeartPulse, Wallet, Sparkles, Home, Plane, Palette,
  Dumbbell, Droplets, BookOpen, Brain, Moon, Footprints, Leaf, PenLine, Music, Sun,
} from 'lucide-react';

export const AREA_ICONS = {
  briefcase: Briefcase,
  graduation: GraduationCap,
  heart: HeartPulse,
  wallet: Wallet,
  sparkles: Sparkles,
  home: Home,
  plane: Plane,
  palette: Palette,
};

export const HABIT_ICONS = {
  dumbbell: Dumbbell,
  droplets: Droplets,
  book: BookOpen,
  brain: Brain,
  moon: Moon,
  walk: Footprints,
  leaf: Leaf,
  pen: PenLine,
  music: Music,
  sun: Sun,
};

export function iconFor(map, name) {
  return map[name] || Sparkles;
}
