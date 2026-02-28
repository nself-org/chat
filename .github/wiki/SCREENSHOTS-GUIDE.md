# Screenshot Documentation Guide

This guide documents the screenshot requirements for nself-chat documentation and provides guidance for capturing and organizing screenshots.

## Overview

Screenshots are essential visual aids that help users understand features and workflows. This document tracks screenshot requirements, provides capture guidelines, and documents the organization structure.

## Screenshot Requirements

Based on the documentation audit, the following 14 screenshots are required for complete documentation coverage:

### High Priority (Must Have)

| #   | Screen Name                                    | Priority | Status    | Location             | Purpose                     |
| --- | ---------------------------------------------- | -------- | --------- | -------------------- | --------------------------- |
| 1   | Setup Wizard - Environment Detection & Backend | 🔴 High  | ❌ Needed | Getting Started      | Show backend auto-detection |
| 2   | Chat Interface - Main View                     | 🔴 High  | ❌ Needed | Features, User Guide | Core messaging interface    |
| 3   | Multi-Tenant Dashboard                         | 🔴 High  | ❌ Needed | Multi-Tenant Guide   | Tenant management interface |

### Medium Priority (Should Have)

| #   | Screen Name                      | Priority  | Status    | Location    | Purpose                 |
| --- | -------------------------------- | --------- | --------- | ----------- | ----------------------- |
| 4   | Rich Message Editor (TipTap)     | 🟡 Medium | ❌ Needed | Features    | Show formatting options |
| 5   | Thread View                      | 🟡 Medium | ❌ Needed | Features    | Threaded conversations  |
| 6   | Analytics Dashboard              | 🟡 Medium | ❌ Needed | Admin Guide | Analytics overview      |
| 7   | Admin Dashboard                  | 🟡 Medium | ❌ Needed | Admin Guide | Admin panel             |
| 8   | Theme Customization (27 presets) | 🟡 Medium | ❌ Needed | Features    | Theme selector          |
| 12  | Mobile View (Responsive)         | 🟡 Medium | ❌ Needed | Features    | Mobile interface        |
| 13  | Voice/Video Call Interface       | 🟡 Medium | ❌ Needed | Features    | Call UI                 |

### Low Priority (Nice to Have)

| #   | Screen Name                        | Priority | Status    | Location     | Purpose           |
| --- | ---------------------------------- | -------- | --------- | ------------ | ----------------- |
| 9   | Integrations (Slack, GitHub, Jira) | 🟢 Low   | ❌ Needed | Features     | Integration setup |
| 10  | Billing Portal (Stripe)            | 🟢 Low   | ❌ Needed | Multi-Tenant | Billing interface |
| 11  | Moderation Dashboard               | 🟢 Low   | ❌ Needed | Admin Guide  | Moderation tools  |
| 14  | Bot Marketplace                    | 🟢 Low   | ❌ Needed | Features     | Bot discovery     |

## Directory Structure

Screenshots should be organized in the following structure:

```
docs/
├── images/
│   ├── screenshots/
│   │   ├── setup/
│   │   │   ├── wizard-step-1-welcome.png
│   │   │   ├── wizard-step-2-owner-info.png
│   │   │   ├── wizard-backend-detection.png
│   │   │   └── ...
│   │   ├── chat/
│   │   │   ├── main-interface.png
│   │   │   ├── thread-view.png
│   │   │   ├── message-editor.png
│   │   │   └── ...
│   │   ├── admin/
│   │   │   ├── dashboard.png
│   │   │   ├── analytics.png
│   │   │   ├── moderation.png
│   │   │   └── ...
│   │   ├── multi-tenant/
│   │   │   ├── tenant-dashboard.png
│   │   │   ├── billing-portal.png
│   │   │   └── ...
│   │   ├── features/
│   │   │   ├── theme-customization.png
│   │   │   ├── integrations.png
│   │   │   ├── bot-marketplace.png
│   │   │   └── ...
│   │   ├── calls/
│   │   │   ├── voice-call.png
│   │   │   ├── video-call.png
│   │   │   └── ...
│   │   └── mobile/
│   │       ├── mobile-chat.png
│   │       ├── mobile-settings.png
│   │       └── ...
│   ├── diagrams/
│   │   ├── architecture.png
│   │   └── ...
│   └── logos/
│       ├── logo.png
│       └── ...
```

## Screenshot Guidelines

### Technical Specifications

**Resolution:**

- Desktop screenshots: 1920x1080 (Full HD) or 2560x1440 (2K)
- Mobile screenshots: 375x812 (iPhone X) or 360x800 (Android)
- Tablet screenshots: 1024x768 (iPad)

**Format:**

- File format: PNG (preferred for UI) or WEBP (for smaller file sizes)
- Compression: Use tools like TinyPNG to optimize file size
- Maximum file size: 500KB per screenshot (aim for < 200KB)

**Quality:**

- DPI: 72 DPI (web standard)
- Color depth: 24-bit (True Color)
- Background: Use default theme (nself dark mode) for consistency

### Content Guidelines

**What to Include:**

- Representative data (no lorem ipsum)
- Realistic user names and content
- Multiple messages/items to show real usage
- Relevant UI states (e.g., hover, active, selected)

**What to Avoid:**

- Personal information (real emails, phone numbers)
- Offensive or inappropriate content
- Lorem ipsum or placeholder text
- Empty states (unless documenting empty states)
- Developer tools or browser chrome (unless relevant)

### Consistency Standards

**Theme:**

- Use "nself" theme preset in dark mode as default
- Document if using different theme
- Maintain same theme across related screenshots

**Browser:**

- Chrome or Firefox (latest stable)
- Hide browser UI (full-screen mode recommended)
- Disable extensions that modify page appearance

**Window Size:**

- Use standard sizes (1920x1080, 1440x900)
- Maintain consistent window size for related screenshots
- Document viewport size in filename if important

## Capture Process

### Tools

**Recommended Screenshot Tools:**

**macOS:**

- Built-in: `Cmd + Shift + 4` (selection) or `Cmd + Shift + 5` (options)
- [CleanShot X](https://cleanshot.com/) - Professional screenshot tool
- [Shottr](https://shottr.cc/) - Free, feature-rich screenshot tool

**Windows:**

- Built-in: `Win + Shift + S` (Snipping Tool)
- [ShareX](https://getsharex.com/) - Free, open-source
- [Greenshot](https://getgreenshot.org/) - Free, lightweight

**Linux:**

- [Flameshot](https://flameshot.org/) - Feature-rich, cross-platform
- [Spectacle](https://apps.kde.org/spectacle/) - KDE screenshot utility
- [GNOME Screenshot](https://gitlab.gnome.org/GNOME/gnome-screenshot) - GNOME default

**Browser Extensions:**

- [Awesome Screenshot](https://www.awesomescreenshot.com/)
- [Nimbus Screenshot](https://nimbusweb.me/screenshot.php)
- [Fireshot](https://getfireshot.com/)

### Workflow

1. **Prepare the Screen**
   - Clear browser cache/localStorage if needed
   - Set up representative test data
   - Choose appropriate theme
   - Set window to standard size

2. **Capture**
   - Use full-screen or selection as appropriate
   - Capture multiple states if documenting interactions
   - Include relevant context (navigation, headers)

3. **Edit**
   - Crop to relevant area
   - Add annotations if needed (arrows, highlights)
   - Blur sensitive information
   - Optimize file size

4. **Save**
   - Use descriptive filename (kebab-case)
   - Save to appropriate subdirectory
   - Commit to version control

5. **Reference**
   - Add to documentation using relative paths
   - Include alt text for accessibility
   - Document image context in surrounding text

## Naming Conventions

### File Naming Pattern

```
[category]-[feature]-[state]-[variant].png
```

**Examples:**

- `setup-wizard-step-1-welcome.png`
- `chat-main-interface-dark-theme.png`
- `admin-dashboard-analytics-overview.png`
- `mobile-chat-thread-view.png`
- `feature-theme-customization-picker.png`

### Guidelines

- Use kebab-case (lowercase with hyphens)
- Be descriptive but concise
- Include state/variant if multiple versions exist
- Avoid special characters or spaces
- Use consistent prefixes for related screenshots

## Using Screenshots in Documentation

### Markdown Syntax

**Basic Image:**

```markdown
![Alt text](docs/images/screenshots/chat/main-interface.png)
```

**With Caption:**

```markdown
![Chat Interface](docs/images/screenshots/chat/main-interface.png)
_Main chat interface showing channels, messages, and sidebar_
```

**Clickable/Linked:**

```markdown
[![Chat Interface](docs/images/screenshots/chat/main-interface.png)](docs/images/screenshots/chat/main-interface.png)
```

### Best Practices

1. **Always include alt text** for accessibility
2. **Add captions** to provide context
3. **Use relative paths** for portability
4. **Reference in text** before showing image
5. **Group related images** with descriptive headings

### Example Documentation Section

```markdown
## Chat Interface

The main chat interface provides a familiar Slack-like experience with channels, direct messages, and rich formatting.

![Chat Interface - Main View](docs/images/screenshots/chat/main-interface.png)
_The main chat interface showing the channel list, message feed, and user sidebar_

### Key Features

- **Channel List** (left sidebar) - Browse and switch between channels
- **Message Feed** (center) - Read and send messages with rich formatting
- **User List** (right sidebar) - See who's online and their status

![Message Editor](docs/images/screenshots/chat/message-editor.png)
_Rich text editor with formatting options, emoji picker, and file upload_
```

## Screenshot Placeholders

Until actual screenshots are captured, documentation can use placeholder references:

### Placeholder Syntax

```markdown
<!-- TODO: Add screenshot -->

**[Screenshot: Setup Wizard - Environment Detection]**

_This screenshot will show the setup wizard automatically detecting the backend environment and displaying connection status._
```

### Placeholder Template

```markdown
<!-- SCREENSHOT PLACEHOLDER -->

**[Screenshot: {Title}]**

_Description: {What the screenshot will show}_

**Location:** `docs/images/screenshots/{category}/{filename}.png`
**Priority:** 🔴 High | 🟡 Medium | 🟢 Low
**Status:** ❌ Needed | 🔄 In Progress | ✅ Complete
```

## Screenshot Update Policy

### When to Update Screenshots

Screenshots should be updated when:

1. **UI Changes** - Visual design or layout modifications
2. **Feature Changes** - New features or functionality
3. **Breaking Changes** - Major version updates that change UX
4. **Branding Updates** - Logo, color scheme, or theme changes
5. **Bug Fixes** - Corrections to UI issues shown in screenshots

### Versioning

- Include version number in commit message
- Document screenshot version in git history
- Keep old screenshots in `docs/images/screenshots/archive/v{version}/`
- Reference version in documentation if relevant

## Accessibility Considerations

### Alt Text Guidelines

**Good Alt Text:**

- Describes the content and function
- Concise but complete
- Includes relevant context
- Avoids "image of" or "screenshot of"

**Examples:**

**Bad:**

```markdown
![Screenshot](image.png)
![Image of chat](image.png)
```

**Good:**

```markdown
![Chat interface with message list and compose box](image.png)
![Setup wizard showing environment detection and backend status](image.png)
```

### Additional Accessibility

- Provide text descriptions in addition to screenshots
- Use high contrast images
- Ensure text in screenshots is readable
- Don't rely solely on screenshots to convey information

## Quality Checklist

Before committing screenshots, verify:

- [ ] Image is clear and properly focused
- [ ] Resolution meets minimum requirements
- [ ] File size is optimized (< 500KB)
- [ ] No personal/sensitive information visible
- [ ] Theme and styling are consistent
- [ ] Filename follows naming conventions
- [ ] Saved to correct directory
- [ ] Alt text is descriptive and accurate
- [ ] Referenced in documentation
- [ ] Caption provides context

## Screenshot Status Tracking

### Current Status

**Total Required:** 14 screenshots
**Completed:** 0
**In Progress:** 0
**Not Started:** 14

**Completion:** 0%

### Progress by Category

| Category     | Total | Complete | In Progress | Not Started |
| ------------ | ----- | -------- | ----------- | ----------- |
| Setup        | 1     | 0        | 0           | 1           |
| Chat         | 3     | 0        | 0           | 3           |
| Admin        | 3     | 0        | 0           | 3           |
| Multi-Tenant | 2     | 0        | 0           | 2           |
| Features     | 3     | 0        | 0           | 3           |
| Calls        | 1     | 0        | 0           | 1           |
| Mobile       | 1     | 0        | 0           | 1           |

### Next Steps

**Immediate (High Priority):**

1. Capture Setup Wizard with backend detection
2. Capture main Chat Interface
3. Capture Multi-Tenant Dashboard

**Short-term (Medium Priority):** 4. Capture Message Editor 5. Capture Thread View 6. Capture Analytics Dashboard 7. Capture Admin Dashboard 8. Capture Theme Customization

**Long-term (Low Priority):** 9. Capture Integrations 10. Capture Billing Portal 11. Capture Moderation Dashboard 12. Capture Mobile Views 13. Capture Call Interface 14. Capture Bot Marketplace

## Contributing Screenshots

### For Contributors

If you'd like to contribute screenshots:

1. **Review this guide** and ensure you understand requirements
2. **Check the tracking table** to see what's needed
3. **Follow capture guidelines** for consistency
4. **Submit a PR** with screenshots and documentation updates
5. **Include context** in PR description about what's shown

### Submission Checklist

- [ ] Screenshots meet technical specifications
- [ ] Files are properly named and organized
- [ ] Images are optimized for web
- [ ] Alt text is provided
- [ ] Documentation is updated to reference screenshots
- [ ] PR includes description of what's shown
- [ ] Multiple viewports captured if relevant (desktop, mobile)

## Resources

### Tools & Services

- [TinyPNG](https://tinypng.com/) - Image compression
- [Squoosh](https://squoosh.app/) - Image optimization
- [Carbon](https://carbon.now.sh/) - Code screenshots
- [Shots](https://shots.so/) - Mockup generator

### References

- [MDN: Accessibility - Alternative Text](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label)
- [W3C: Alternative Text](https://www.w3.org/WAI/tutorials/images/)
- [Keep a Changelog](https://keepachangelog.com/) - Versioning guidance

## Version History

| Version | Date       | Changes                          |
| ------- | ---------- | -------------------------------- |
| 1.0.0   | 2026-01-31 | Initial screenshot guide created |

---

**Last Updated:** January 31, 2026
**Status:** Active
**Maintainer:** Documentation Team

[← Back to Documentation Home](Home.md)
