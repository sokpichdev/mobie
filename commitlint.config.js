// Commit message rules for mobie.
// Enforces Conventional Commits, e.g.  feat(security): add public-key TLS pinning
// Enforced in CI by .github/workflows/commitlint.yml; see standards/git_standards.md.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allowed commit types.
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'perf', 'build', 'ci', 'revert'],
    ],
    'type-empty': [2, 'never'],
    'type-case': [2, 'always', 'lower-case'],

    // Scope is optional and free-form, but documented common scopes are:
    //   security · networking · ui · auth · storage · agents · skills · workflows
    //   checklists · standards · architecture · prompts · templates · examples · ci · repo
    'scope-case': [2, 'always', 'lower-case'],

    // Subject: required, no trailing period. Case is left flexible to reduce friction.
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // Keep the header readable.
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [1, 'always'],
  },
};
