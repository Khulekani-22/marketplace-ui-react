# Quick Start Guide: My Subscriptions & Bookings

## Access the Page

1. **Navigate to**: http://localhost:5173/subscriptions
2. **Or from Dashboard**: Click "My Subscriptions" in the menu

## Page Overview

```
┌─────────────────────────────────────────────────────────┐
│  My Subscriptions & Bookings                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Subscriptions (5)] [Bookings (3)]        [Refresh]  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Service  │  │ Service  │  │ Service  │            │
│  │  Card 1  │  │  Card 2  │  │  Card 3  │            │
│  │          │  │          │  │          │            │
│  │ R 500    │  │ R 750    │  │ R 1000   │            │
│  │[Unsub]   │  │[Unsub]   │  │[Unsub]   │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Features at a Glance

### 📋 Subscriptions Tab
- View all your active service subscriptions
- See service details (title, description, price, vendor)
- Unsubscribe from services you no longer need
- View next scheduled session (if booked)

### 📅 Bookings Tab
- See all your scheduled, completed, and canceled bookings
- View booking dates and time slots
- Check booking status with color-coded badges
- Cancel scheduled bookings
- View service details

## Common Actions

### Unsubscribe from a Service
```
1. Click the "Subscriptions" tab
2. Find the service you want to unsubscribe from
3. Click the "Unsubscribe" button
4. Confirm (service is immediately removed)
```

### View Your Bookings
```
1. Click the "Bookings" tab
2. See all your bookings listed
3. Each booking shows:
   - Service name
   - Date & time
   - Status (Scheduled/Completed/Canceled)
   - Price paid
```

### Cancel a Booking
```
1. Go to "Bookings" tab
2. Find the scheduled booking
3. Click the X button
4. Booking will be canceled
```

### Refresh Data
```
1. Click the "Refresh" button (top right)
2. Page will reload latest subscriptions and bookings
3. Useful after making changes in another tab
```

## Status Badges

**Subscriptions:**
- 🟢 Active - Currently subscribed
- 🔴 Canceled - Removed from your subscriptions

**Bookings:**
- 🔵 **Scheduled** - Upcoming session
- 🟢 **Completed** - Session finished
- 🔴 **Canceled** - Booking canceled

## Empty States

**No Subscriptions:**
```
┌─────────────────────────────────────┐
│   🛒                                │
│   No active subscriptions           │
│   Browse the marketplace to         │
│   subscribe to services             │
│   [Browse Marketplace]              │
└─────────────────────────────────────┘
```

**No Bookings:**
```
┌─────────────────────────────────────┐
│   📅                                │
│   No bookings found                 │
│   Book service sessions to          │
│   see them here                     │
│   [Book a Session]                  │
└─────────────────────────────────────┘
```

## Example Subscription Card

```
┌────────────────────────────────────┐
│  [Service Image]                   │
├────────────────────────────────────┤
│  Business Consultation             │
│  🏢 ABC Consulting                 │
│  🏷️ Business Services              │
│                                    │
│  Expert business advisory and      │
│  strategic planning...             │
│                                    │
│  ℹ️ Next Session:                  │
│     Oct 20, 2025 at 2:00 PM       │
│                                    │
├────────────────────────────────────┤
│  R 500        ⭐ 4.5               │
│               [🚫 Unsubscribe]     │
└────────────────────────────────────┘
```

## Example Booking Card

```
┌────────────────────────────────────┐
│  Marketing Strategy Session    [🔵]│
├────────────────────────────────────┤
│  🏢 XYZ Marketing Agency           │
│                                    │
│  📅 October 25, 2025               │
│  🕐 10:00 AM                       │
│                                    │
│  💰 R 750                          │
│                                    │
│  📅 Booked on Oct 15, 2025         │
├────────────────────────────────────┤
│  [View Service]            [❌]    │
└────────────────────────────────────┘
```

## Tips

1. **Keep Track**: Check this page regularly to manage upcoming sessions
2. **Plan Ahead**: Schedule bookings in advance for popular services
3. **Stay Updated**: Use the refresh button after making changes
4. **Review Details**: Click "View Service" to see full service information
5. **Cancel Early**: Cancel bookings as early as possible if plans change

## Keyboard Shortcuts

- `Tab`: Navigate between buttons
- `Enter`: Click focused button
- `Escape`: Dismiss error alerts (when focused)

## Mobile Experience

The page is fully responsive:
- Cards stack vertically on mobile
- Tabs remain at the top
- All actions remain accessible
- Touch-friendly buttons

## Need Help?

If you encounter issues:
1. Try refreshing the page
2. Log out and log back in
3. Check your internet connection
4. Contact support if problems persist

## Quick Links

- 🏪 [Browse Marketplace](/dashboard)
- 💳 [My Wallet](/wallet)
- 👤 [My Profile](/view-profile)
- ⚙️ [Settings](/settings)

---

**Page URL**: http://localhost:5173/subscriptions  
**Authentication**: Required (Firebase Auth)  
**Last Updated**: October 17, 2025
