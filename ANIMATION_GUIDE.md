# ChartedArt Animation Design Guide

## Philosophy
Animations in ChartedArt should feel **calm, natural, and purposeful** - like turning pages in an art book, not flashing billboards. The app helps users create art, so interactions should be smooth and unobtrusive.

## ✅ What We Changed

### Before (Problems)
- ❌ **Fade in/out everywhere** - distracting opacity changes
- ❌ **Slow transitions (0.5s)** - felt sluggish
- ❌ **Large movements (30-50px)** - too dramatic
- ❌ **Same animation for everything** - no personality

### After (Solutions)
- ✅ **Subtle snap-in effect** - content "clicks" into place smoothly
- ✅ **Fast timing (0.25-0.3s)** - snappy but not jarring
- ✅ **Small movements (12-24px)** - gentle and refined
- ✅ **Spring physics** - natural, tactile feel for interactions
- ✅ **Context-appropriate** - different animations for different purposes

## Animation Principles

### 1. **Avoid Opacity Changes**
Opacity fades are visually distracting. Use position and scale instead.

```typescript
// ❌ Bad - jarring fade
{ opacity: 0, y: 30 } → { opacity: 1, y: 0 }

// ✅ Good - snap-in slide
{ x: 12, scale: 0.97 } → { x: 0, scale: 1 }
```

### 2. **Use Minimal Movement**
Small movements (8-24px) feel more polished than large ones (50px+).

```typescript
// ❌ Bad - too dramatic
initial: { y: 50 }

// ✅ Good - subtle
initial: { y: 12 }
```

### 3. **Fast but Smooth**
- **Page transitions:** 0.25s with snap easing
- **Interactive elements:** Spring physics (stiffness: 300-400)
- **Micro-interactions:** 0.15-0.2s

### 4. **Natural Easing & Spring Physics**
Use **snap-in easing** `[0.34, 1.56, 0.64, 1]` for content transitions - creates subtle "settling" effect.

For hover/interactive elements, use **spring physics** for natural, tactile feel:
```typescript
transition: { 
  type: 'spring',
  stiffness: 350,  // Higher = snappier
  damping: 16,     // Lower = more bounce
}
```

## Animation Variants Reference

### Page Transitions
```typescript
import { pageTransition } from '@/components/animations/variants';

<motion.div
  initial={{ x: 12, scale: 0.97 }}
  animate={{ x: 0, scale: 1 }}
  exit={{ x: -12, scale: 0.97 }}
  transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }} // Snap-in
>
  {/* Page content */}
</motion.div>
```

### Content Reveal (replaces fadeIn)
```typescript
import { gentleReveal } from '@/components/animations/variants';

<motion.div
  variants={gentleReveal}
  initial="initial"
  animate="animate"
>
  {/* Content */}
</motion.div>
```

### Interactive Elements

#### Buttons
```typescript
import { buttonHover, buttonTap } from '@/components/animations/variants';

<motion.button
  whileHover={buttonHover}  // scale: 1.05 with spring
  whileTap={buttonTap}      // scale: 0.95
>
  Click Me
</motion.button>

// Spring physics for natural, bouncy feel
// stiffness: 400, damping: 17
```

#### Gallery Items
```typescript
import { galleryTileHover } from '@/components/animations/variants';

<motion.div
  whileHover={galleryTileHover}  // scale: 1.05 + shadow
>
  <img src={artwork} />
</motion.div>
```

### Modals & Dialogs
```typescript
import { modal, modalBackdrop } from '@/components/animations/variants';

<AnimatePresence>
  {isOpen && (
    <>
      {/* Only backdrop uses opacity */}
      <motion.div 
        variants={modalBackdrop}
        className="fixed inset-0 bg-black/50"
      />
      
      {/* Modal content uses scale + position */}
      <motion.div
        variants={modal}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Dialog content */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Lists & Staggered Content
```typescript
import { listContainer, listItem } from '@/components/animations/variants';

<motion.ul variants={listContainer} initial="initial" animate="animate">
  {items.map((item) => (
    <motion.li key={item.id} variants={listItem}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

### Accordions
```typescript
import { accordion } from '@/components/animations/variants';

<motion.div
  variants={accordion}
  initial="collapsed"
  animate={isOpen ? "expanded" : "collapsed"}
>
  {/* Content */}
</motion.div>
```

## When to Use Each Animation

| Use Case | Animation | Why |
|----------|-----------|-----|
| Page navigation | `pageTransition` | Subtle, doesn't distract from content |
| Gallery/Product grid | `scale` | Shows depth, feels tactile |
| Form status changes | `formStatus` | Clear feedback without disruption |
| Modals/Dialogs | `modal` + `modalBackdrop` | Backdrop fades, content pops |
| Lists loading | `listContainer` + `listItem` | Progressive reveal feels natural |
| Hover states | `*Hover` variants | Immediate feedback |
| Error states | `formStatus.error` | Shake draws attention |

## CSS Animations (index.css)

These are good to keep as they're purposeful:
- ✅ `animate-gradient-x` - subtle, brand reinforcement
- ✅ `animate-ripple` - tactile button feedback
- ✅ `animate-shake-error` - clear error indication
- ✅ `animate-glow-warning` - important state
- ✅ `animate-spin-slow` - loading indicators

## Common Mistakes to Avoid

### ❌ Don't do this:
```typescript
// Opacity fade on main content
<motion.div animate={{ opacity: 1 }} />

// Too slow
transition={{ duration: 0.8 }}

// Too much movement
initial={{ y: 100 }}

// Using fade for everything
variants={fadeIn}
```

### ✅ Do this instead:
```typescript
// Use position/scale
<motion.div animate={{ x: 0, scale: 1 }} />

// Snappy timing
transition={{ duration: 0.2 }}

// Minimal movement
initial={{ y: 12 }}

// Context-appropriate variant
variants={gentleReveal}
```

## Accessibility

All animations respect `prefers-reduced-motion`. This is already implemented in `index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  /* All custom animations are disabled */
}
```

## Testing Checklist

When adding new animations, verify:
- [ ] No jarring opacity changes on main content
- [ ] Duration is 0.3s or less
- [ ] Movement is subtle (< 30px)
- [ ] Works on mobile (not too fast/slow)
- [ ] Respects `prefers-reduced-motion`
- [ ] Doesn't slow down perceived performance

## Examples in the Codebase

### Good Examples
- **RootLayout.tsx (lines 223-234)**: Subtle page transitions
- **HomePage.tsx (line 114)**: Hover scale on gallery images
- **Card hover animations**: Small lift on hover

### Before/After Comparison

#### Page Transitions
```typescript
// BEFORE ❌
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 50 }}
transition={{ duration: 0.5 }}

// AFTER ✅ (with snap-in effect)
initial={{ x: 12, scale: 0.97 }}
animate={{ x: 0, scale: 1 }}
exit={{ x: -12, scale: 0.97 }}
transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
// ↑ Snap-in easing creates subtle "settling" effect
```

## Quick Reference: Timing Chart

| Element Type | Duration | Movement | Physics |
|--------------|----------|----------|----------|
| Page transition | 0.25s | 12px horizontal + 3% scale | Snap-in easing |
| Modal enter/exit | Spring | 20px vertical + 8% scale | Stiffness: 300, Damping: 20 |
| Content reveal | 0.3s | 16px vertical + 4% scale | Snap-in easing |
| List items (stagger) | 0.25s | 16px horizontal + 3% scale | Snap-in easing |
| Button hover | Spring | 5% scale | Stiffness: 400, Damping: 17 |
| Gallery item hover | Spring | 5% scale + 4px lift | Stiffness: 300, Damping: 15 |
| Toast notification | Spring | 100px from edge + 5% scale | Stiffness: 350, Damping: 22 |

## Value Proposition Alignment

ChartedArt helps people **create beautiful, personal art**. Animations should:
- ✅ Feel calming and focused (like painting)
- ✅ Make navigation feel seamless
- ✅ Provide feedback without interruption
- ✅ Enhance, never distract from, the content
- ❌ Never flash, flicker, or fade unnecessarily

---

**Remember**: The best animation is often the one you barely notice. Users should focus on their art, not our UI tricks.
