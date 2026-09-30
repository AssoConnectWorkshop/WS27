---
title: Alert
status: New
source: https://zeroheight.com/6f840074f/v/latest/p/41fad3-alert
figma: https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/
---

> A static, persistent inline message tied to the state of the page or its context.

# Tab: Description

## Anatomy

CTAs are optional.

Figma: [node 3399:13886](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3399:13886)

1. Optional icon
2. Title (mandatory)
3. Optional description
4. Optional cross (close)
5. Optional CTA: any type accepted

## Variants

| Variant | Meaning | Closable (X) |
| :--- | :--- | :--- |
| **Default** | Neutral information | Optional |
| **Success** | Positive information | Optional |
| **Warning** | Touchy information | Optional |
| **Destructive** | Critical information | No: stays until the problem is resolved |

The Default alert can include an optional icon.

Figma: [Default](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3399:13910) · [Success](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3730:32123) · [Warning](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3730:32150) · [Destructive](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3399:13887)

## Types

- **Outline**: the discreet style. Required when the alert sits inside a condensed component such as a card, a collapsible or any other organism.
- **Accent**: the more visible style, for important messages. Required when the alert is shown at page level.

Figma (outline and accent side by side): [Default](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3846:28636) · [Destructive](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3846:32209) · [Warning](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3846:37011) · [Success](https://www.figma.com/design/NQI0w73MUajqPwEh5eOu2f/?node-id=3846:34670)

## Position

1. **Global alert**: at the top of the page, below the header.
   The message holds true whatever the user does (system error, permissions, loading issue).
2. **Local alert**: anchored to the element that triggers it (row, field, section), wherever that element sits on the page.
   The message depends on a specific user action or selection, and disappears if that action is undone.

Test to apply: *"Does this message still hold true if the user did nothing?"* Yes → top of the page. No → next to its cause.

*Example: an alert placed above the button, near its closest context.*

## Style

- Border: 1 px, aligned inside.

# Tab: How to use

## Outline or Accent?

- Use the very visible alert (**accent**) when the alert applies to the whole page, across multiple sections.
- Use the discreet alert (**outline**) when the alert sits in a block, card, sheet or any other condensed component within a page.

## Alert or Sonner?

| Rule | Guidance |
| :--- | :--- |
| ✅ Do | Use a **Sonner** for immediate feedback after a user action. |
| ⚠️ Caution | Use an **Alert** for a persistent message related to the state of the page or its context. |
