export const isNotNullish = <T>(value: T | null | undefined): value is T =>
  value != null;
