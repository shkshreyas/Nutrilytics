# AI Chat Interface - Visual Reference

## Component Layout

```
┌─────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════╗  │
│  ║         HEADER (Primary Gradient)                 ║  │
│  ║  ┌──┐  AI Nutrition Coach        [X]             ║  │
│  ║  │✨│  Premium / 3 messages left                  ║  │
│  ║  └──┘                                             ║  │
│  ╚═══════════════════════════════════════════════════╝  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ┌──┐ ┌─────────────────────────────┐            │ │
│  │  │✨│ │ AI Message (Glassmorphism)  │            │ │
│  │  └──┘ │ with blur effect...         │            │ │
│  │       └─────────────────────────────┘            │ │
│  │                                                    │ │
│  │            ┌──────────────────────┐ ┌──┐         │ │
│  │            │ User Message         │ │👤│         │ │
│  │            │ (Primary Gradient)   │ └──┘         │ │
│  │            └──────────────────────┘              │ │
│  │                                                    │ │
│  │  ┌──┐ ┌─────────────────────────────┐            │ │
│  │  │✨│ │ AI typing...                │            │ │
│  │  └──┘ │ ● ● ●  (animated dots)      │            │ │
│  │       └─────────────────────────────┘            │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ╔══════════════════════════════════════════════╗  │ │
│  │  ║ 🔒 Unlock Unlimited AI Chat                  ║  │ │
│  │  ║ Get unlimited access with premium            ║  │ │
│  │  ║ ┌──────────────────────────────────────────┐ ║  │ │
│  │  ║ │  Upgrade to Premium (Gradient Button)    │ ║  │ │
│  │  ║ └──────────────────────────────────────────┘ ║  │ │
│  │  ║ Maybe later                                  ║  │ │
│  │  ╚══════════════════════════════════════════════╝  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [🍽️ Meal Plan] [⚠️ Allergens] [💡 Tips]          │ │
│  │ (Quick Action Buttons with Gradients)              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ╔════════════════════════════════════════════════╗ │ │
│  │ ║ Ask me anything about nutrition...            ║ │ │
│  │ ║                                                ║ │ │
│  │ ║ [🎤]                              [➤]         ║ │ │
│  │ ╚════════════════════════════════════════════════╝ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Color Scheme

### Header
- **Background:** Primary Gradient (Indigo → Purple → Pink)
- **Text:** White
- **Avatar:** White with 20% opacity background

### User Messages
- **Background:** Primary Gradient (Indigo → Purple → Pink)
- **Text:** White
- **Alignment:** Right
- **Border Radius:** 20px (bottom-right: 4px)

### AI Messages
- **Background:** Glassmorphism (blur + semi-transparent)
- **Text:** Theme-aware (dark/light)
- **Alignment:** Left
- **Border:** 1px white with 20% opacity

### Quick Actions
- **Meal Plan:** Secondary Gradient (Emerald → Cyan → Blue)
- **Allergens:** Warning Gradient (Yellow → Orange)
- **Tips:** Success Gradient (Green)

### Input Area
- **Background:** Glassmorphism
- **Border:** Gradient on focus
- **Send Button:** Primary Gradient (when active) / Gray (when disabled)

## Animation States

### Typing Indicator
```
Frame 1:  ●  ○  ○
Frame 2:  ○  ●  ○
Frame 3:  ○  ○  ●
Frame 4:  ○  ●  ○
(Repeats)
```

### Button Press
```
Normal:   Scale 1.0
Pressed:  Scale 0.95
Released: Scale 1.0 (spring animation)
```

### Message Streaming
```
"Hello"
"Hello, I"
"Hello, I can"
"Hello, I can help"
"Hello, I can help you"
(Character by character)
```

## Responsive Behavior

### Keyboard Open
- Input area stays at bottom
- Messages list adjusts height
- Auto-scroll to latest message

### Upsell Card
- Appears after 3 messages
- Positioned above input area
- Dismissible with animation
- Blocks quick actions when visible

### Message Bubbles
- Max width: 70% of screen
- Wraps text properly
- Maintains aspect ratio
- Scrollable content

## Theme Variations

### Light Mode
- Background: White (#FFFFFF)
- Surface: Slate 50 (#F8FAFC)
- Text Primary: Slate 900 (#0F172A)
- Text Secondary: Slate 600 (#64748B)
- Card: White with 80% opacity

### Dark Mode
- Background: Slate 900 (#0F172A)
- Surface: Slate 800 (#1E293B)
- Text Primary: Slate 50 (#F8FAFC)
- Text Secondary: Slate 400 (#94A3B8)
- Card: Slate 800 with 80% opacity

## Interactive Elements

### Tappable Areas
1. **Close Button** (40x40px)
   - Top-right corner
   - White background with 20% opacity
   - Close icon

2. **Quick Action Buttons** (Full width, 40px height)
   - Gradient backgrounds
   - Icon + Text
   - Haptic feedback

3. **Voice Button** (40x40px)
   - Microphone icon
   - Left side of input
   - Haptic feedback

4. **Send Button** (48x48px)
   - Gradient background
   - Send icon / Loading spinner
   - Right side of input
   - Disabled when no text

5. **Upgrade Button** (Full width, 48px height)
   - Primary gradient
   - White text
   - In upsell card

6. **Dismiss Button** (Text only)
   - "Maybe later"
   - Secondary text color
   - Below upgrade button

## Spacing & Sizing

### Padding
- Screen edges: 16px
- Message bubbles: 12-16px
- Input area: 8-12px
- Header: 16px horizontal, 16-20px vertical

### Margins
- Between messages: 16px
- Between sections: 8-12px
- Quick actions gap: 8px

### Border Radius
- Message bubbles: 20px
- Quick actions: 20px
- Input card: 16px
- Avatars: 50% (circular)
- Buttons: 24px

### Font Sizes
- Header title: 18px (bold)
- Header subtitle: 12px
- Message text: 16px
- Quick action text: 12px (semi-bold)
- Input text: 16px
- Upsell title: 20px (bold)
- Upsell description: 14px

## Accessibility

### Screen Reader Labels
- "AI Nutrition Coach header"
- "Close chat button"
- "Message from AI"
- "Your message"
- "Type your message"
- "Send message button"
- "Voice input button"
- "Quick action: Generate meal plan"
- "Upgrade to premium button"

### Touch Targets
- Minimum 44x44px for all interactive elements
- Adequate spacing between buttons
- Clear visual feedback on press

### Color Contrast
- WCAG AA compliant
- High contrast mode support
- Theme-aware text colors

## Performance Notes

- FlatList for efficient scrolling
- Lazy loading of messages
- Optimized gradient rendering
- Debounced scroll animations
- Minimal re-renders during streaming
