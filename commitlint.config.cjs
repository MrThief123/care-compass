module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Subjects often start with a feature ID or acronym (F0-28, FAM-17, RLS, CHG-059), which the
    // default sentence-case rule rejects.
    "subject-case": [0],
    // Feature commits name the ticket and what changed; 100 characters is too tight for that.
    "header-max-length": [2, "always", 150],
  },
};
