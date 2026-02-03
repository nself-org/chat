# Accessibility Guide

**Version**: 0.9.1
**Last Updated**: February 3, 2026
**WCAG Level**: 2.1 AA Compliant

---

## Overview

nChat is committed to accessibility for all users. We follow **WCAG 2.1 Level AA** guidelines and test with screen readers, keyboard navigation, and automated tools.

## Quick Reference

### Keyboard Shortcuts

- **Ctrl/Cmd + K**: Focus message input
- **Escape**: Close modals
- **Tab**: Navigate forward
- **Shift + Tab**: Navigate backward
- **Enter**: Activate buttons/links
- **Space**: Toggle checkboxes

### Screen Readers Supported

✅ VoiceOver (macOS, iOS)  
✅ NVDA (Windows)  
✅ JAWS (Windows)  
✅ TalkBack (Android)

### Color Contrast

- Normal text: **4.5:1** minimum
- Large text: **3:1** minimum
- UI components: **3:1** minimum

## Accessibility Features

### Keyboard Navigation

All interactive elements are keyboard accessible with visible focus indicators.

### Screen Reader Support

Proper ARIA labels, live regions, and semantic HTML throughout.

### Visual Accessibility

High contrast mode, resizable text, no color-only information.

### Testing

- ESLint jsx-a11y rules
- jest-axe unit tests
- Playwright + axe-core E2E tests
- Lighthouse CI audits

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Report Accessibility Issues](https://github.com/nself/nself-chat/issues/new?labels=accessibility)

---

**Questions?** Contact accessibility@nself.chat
