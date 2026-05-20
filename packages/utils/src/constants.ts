import type { Gender, RelationshipType } from "@school/types";

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  father: "Padre",
  mother: "Madre",
  tutor: "Tutor",
  grandfather: "Abuelo",
  grandmother: "Abuela",
  uncle: "Tío",
  aunt: "Tía",
  other: "Otro",
};

export const DEFAULT_PAGE_SIZE = 10;

export const LICENSE_CATEGORIES = [
  "A",
  "B",
  "C1",
  "C2",
  "C3",
  "D1",
  "D2",
  "E1",
  "E2",
] as const;
