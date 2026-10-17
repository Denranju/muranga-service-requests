// Password rules used when registering or resetting a password.
export const RULES = [
  { key: "rule.len", test: (p) => p.length >= 8 },
  { key: "rule.upper", test: (p) => /[A-Z]/.test(p) },
  { key: "rule.lower", test: (p) => /[a-z]/.test(p) },
  { key: "rule.num", test: (p) => /\d/.test(p) },
  { key: "rule.sym", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const passedRules = (p) => RULES.filter((r) => r.test(p)).length;
export const isStrong = (p) => passedRules(p) === RULES.length;
