export const FIELD_LIMITS = {
  firstName: 30,
  lastName: 30,
  title: 60,
  alias: 24
};

export const clampValue = (value, limit) => (value || "").slice(0, limit);
