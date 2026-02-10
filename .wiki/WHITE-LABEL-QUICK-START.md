# White Label System - Quick Start Guide

Get started with nself-chat's white-label system in 5 minutes.

## Overview

The white-label system allows you to completely customize your platform's appearance:

- Choose from 5 pre-built templates
- Customize colors and themes
- Upload your logos
- Configure custom domains
- Add custom CSS

---

## Quick Start

### 1. Access Branding Dashboard

Navigate to: **`/admin/branding`**

You'll see 5 tabs:

- **Template** - Choose your platform style
- **Theme** - Customize colors
- **Logos** - Upload branding assets
- **Domain** - Configure custom domain
- **Custom CSS** - Advanced styling

### 2. Choose a Template (30 seconds)

Click the **Template** tab and select:

| Template     | Best For             | Primary Color |
| ------------ | -------------------- | ------------- |
| **Default**  | Modern teams         | Cyan          |
| **Slack**    | Enterprises          | Purple        |
| **Discord**  | Communities          | Blue          |
| **Telegram** | Privacy-focused      | Sky Blue      |
| **WhatsApp** | Personal/Small teams | Green         |

Click **Apply Template** → Confirm

### 3. Customize Theme (2 minutes)

Click the **Theme** tab:

1. Toggle between **Light** and **Dark** mode
2. Click any color swatch to change it
3. See live preview on the right
4. Click **Save Theme** when done

**Pro Tip**: Click **Export** to save your theme for backup!

### 4. Upload Logos (1 minute)

Click the **Logos** tab and upload:

1. **Primary Logo** (200x60px) - Main logo
2. **Square Logo** (512x512px) - Icon/Avatar
3. **Favicon** (32x32px) - Browser tab icon

Drag & drop or click **Upload**.

### 5. Configure Domain (Optional)

Click the **Domain** tab:

1. Enter your domain: `chat.yourcompany.com`
2. Click **Configure**
3. Add the DNS records to your domain registrar:

   ```
   Type: CNAME
   Name: chat
   Value: your-tenant-id.nself.app

   Type: TXT
   Name: _nself-verification
   Value: [verification-token]
   ```

4. Wait 24-48 hours for DNS propagation
5. Click **Verify Domain**

---

## Advanced Features

### Custom CSS

Add your own styles in the **Custom CSS** tab:

```css
/* Example: Custom header gradient */
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Example: Rounded message bubbles */
.message-bubble {
  border-radius: 16px;
}

/* Example: Custom button style */
.btn-primary {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

Click **Save CSS**.

### Export Configuration

Save your complete branding setup:

1. Click **Export** button (top right)
2. Save the JSON file
3. Use for backup or to clone to another instance

### Import Configuration

Restore or clone branding:

1. Click **Import** button
2. Select your JSON file
3. Confirm import

---

## Template Comparison

| Feature         | Default | Slack | Discord | Telegram | WhatsApp |
| --------------- | ------- | ----- | ------- | -------- | -------- |
| Threads         | ✅      | ✅    | ✅      | ❌       | ❌       |
| Reactions       | ✅      | ✅    | ✅      | ✅       | ✅       |
| Voice Notes     | ✅      | ❌    | ✅      | ✅       | ✅       |
| Code Blocks     | ✅      | ✅    | ✅      | ✅       | ❌       |
| Message Bubbles | ❌      | ❌    | ❌      | ✅       | ✅       |

---

## Common Use Cases

### Corporate Branding

```
Template: Slack
Colors: Company brand colors
Logo: Corporate logo (horizontal)
Domain: team.yourcompany.com
```

### Gaming Community

```
Template: Discord
Colors: Dark theme with vibrant accent
Logo: Gaming clan/community logo
Domain: chat.yourclan.gg
```

### Privacy-Focused App

```
Template: Telegram
Colors: Clean, minimal colors
Logo: Lock/Shield icon
Domain: secure.yourapp.com
```

### Customer Support

```
Template: WhatsApp
Colors: Brand colors with green accent
Logo: Company support logo
Domain: support.yourcompany.com
```

---

## Troubleshooting

### Theme not updating?

- Clear browser cache (Cmd/Ctrl + Shift + R)
- Check browser console for errors
- Try incognito mode

### Logo not showing?

- Check file size (must be < 5MB)
- Use PNG, JPG, or SVG format
- Ensure transparent background

### Domain not verifying?

- Wait 24-48 hours for DNS propagation
- Use `dig` or `nslookup` to check DNS records
- Ensure no typos in DNS configuration

### CSS not applying?

- Check for syntax errors
- Use more specific selectors
- Clear browser cache
- Check if overridden by other styles

---

## Best Practices

### Colors

- ✅ Maintain contrast (WCAG AA minimum)
- ✅ Test both light and dark modes
- ✅ Use consistent primary color
- ❌ Don't rely solely on color for information

### Logos

- ✅ Use transparent backgrounds
- ✅ Keep file sizes under 500KB
- ✅ Test at various sizes
- ❌ Don't use low-resolution images

### Custom CSS

- ✅ Use specific selectors
- ✅ Comment your code
- ✅ Test thoroughly
- ❌ Don't use `!important` excessively

### Domains

- ✅ Use subdomains (chat.domain.com)
- ✅ Wait for DNS propagation
- ✅ Configure SPF/DKIM for email
- ❌ Don't use root domains

---

## Getting Help

- **Documentation**: [WHITE-LABEL-COMPLETE.md](./WHITE-LABEL-COMPLETE.md)
- **Support**: support@nself.org
- **Community**: Discord #white-label channel
- **Enterprise**: enterprise@nself.org

---

## Next Steps

After basic setup:

1. **Invite Team**: Add users to test the new branding
2. **Mobile Test**: Check appearance on mobile devices
3. **Email Templates**: Customize email branding (coming soon)
4. **Documentation**: Update your docs with new branding
5. **Announcement**: Let users know about the refresh

---

**Quick Reference**:

- Dashboard: `/admin/branding`
- Docs: `/docs/WHITE-LABEL-COMPLETE.md`
- API: `/api/tenants/[id]/branding`

**Happy Branding!** 🎨
