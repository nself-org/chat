# ɳChat Shopify Plugin

**Plugin Name**: `shopify`
**Version**: 1.0.0
**Category**: E-commerce
**Status**: Production Ready
**Priority**: LOW (E-commerce)

---

## Overview

The Shopify Plugin integrates Shopify stores with ɳChat, enabling order notifications, product embeds, and customer support chat.

---

## Features

- ✅ **Store Integration** - Connect Shopify stores
- ✅ **Order Notifications** - Real-time order updates
- ✅ **Product Embeds** - Display products in chat
- ✅ **Customer Support** - Chat-based support
- ✅ **Webhook Events** - Order, product, customer events
- ✅ **OAuth Authentication** - Shopify app installation

---

## Installation

### Prerequisites

- Shopify Partner account
- Shopify app created
- OAuth credentials

### Setup Shopify App

1. Go to Shopify Partners Dashboard
2. Create new app
3. Set OAuth redirect: `https://yourdomain.com/api/integrations/shopify/callback`
4. Set scopes: `read_products`, `read_orders`, `read_customers`
5. Get API key and secret

### Configuration

```bash
# backend/.env.plugins
SHOPIFY_ENABLED=true
SHOPIFY_API_KEY=abc123...
SHOPIFY_API_SECRET=abc123...
SHOPIFY_SCOPES=read_products,read_orders
SHOPIFY_WEBHOOK_SECRET=whsec_abc123...
```

---

## API Endpoints

### Install App

```bash
GET /api/integrations/shopify/install?shop=store.myshopify.com
```

### Connect Store

```bash
POST /api/integrations/shopify/connect
{
  "shop": "store.myshopify.com",
  "channelId": "channel-123"
}
```

### List Products

```bash
GET /api/integrations/shopify/products
```

### List Orders

```bash
GET /api/integrations/shopify/orders
```

### Webhook Handler

```bash
POST /api/integrations/shopify/webhook
X-Shopify-Topic: orders/create
X-Shopify-Hmac-SHA256: ...
```

---

## Event Types

- **orders/create** - New order placed
- **orders/updated** - Order status changed
- **products/create** - New product added
- **products/update** - Product updated
- **customers/create** - New customer registered

---

## Product Embeds

Shopify URLs are automatically unfurled:

```
https://store.myshopify.com/products/product-name
```

Displays:

- Product image
- Product title
- Price
- Buy button (optional)

---

## Customer Support

Create support tickets from orders:

```bash
POST /api/integrations/shopify/support
{
  "orderId": "123",
  "issue": "Product damaged"
}
```

---

## Support

- **Shopify Partners**: https://partners.shopify.com
- **Shopify Docs**: https://shopify.dev

---

## Related Documentation

- [Plugin System Overview](./README.md)
- [Installation Guide](./INSTALLATION-GUIDE.md)
