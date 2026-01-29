/**
 * Semantic Release Configuration for nself-chat
 * @see https://semantic-release.gitbook.io/semantic-release/
 */
module.exports = {
  branches: [
    'main',
    { name: 'develop', prerelease: 'beta', channel: 'beta' },
    { name: 'next', prerelease: 'alpha', channel: 'alpha' },
  ],
  plugins: [
    // Analyze commits with conventional commit messages
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'docs', release: 'patch' },
          { type: 'style', release: 'patch' },
          { type: 'test', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { breaking: true, release: 'major' },
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING'],
        },
      },
    ],

    // Generate release notes
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features', hidden: false },
            { type: 'fix', section: 'Bug Fixes', hidden: false },
            { type: 'perf', section: 'Performance Improvements', hidden: false },
            { type: 'refactor', section: 'Code Refactoring', hidden: false },
            { type: 'docs', section: 'Documentation', hidden: false },
            { type: 'style', section: 'Styles', hidden: true },
            { type: 'test', section: 'Tests', hidden: true },
            { type: 'chore', section: 'Chores', hidden: true },
            { type: 'ci', section: 'CI/CD', hidden: true },
          ],
        },
      },
    ],

    // Update CHANGELOG.md
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# Changelog\n\nAll notable changes to nself-chat will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
      },
    ],

    // Update package.json version
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],

    // Commit the changes
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],

    // Create GitHub release
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'nself-chat-web-*.tar.gz', label: 'Web Build' },
        ],
        successComment: ':rocket: This PR is included in version ${nextRelease.version}',
        failComment: false,
        releasedLabels: ['released'],
      },
    ],
  ],
};
