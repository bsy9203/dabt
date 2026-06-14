# Design Specification: Product Detail Drawer & Mini-Cart Drawer

This document defines the architectural structure, design decisions, and dynamic interactions for transforming the static category grid pages into interactive, premium e-commerce Product Detail Pages (PDP) using sliding side panels.

## 📋 Understanding Summary
* **Goal**: Convert sales grid lists ([juice_sales.html](file:///Users/bangseoyeon/Desktop/IYO%20HOUSE/0531/juice_sales.html), [spread_sales.html](file:///Users/bangseoyeon/Desktop/IYO%20HOUSE/0531/spread_sales.html), [chips_sales.html](file:///Users/bangseoyeon/Desktop/IYO%20HOUSE/0531/chips_sales.html)) into detailed product views without losing the signature grid gallery layout.
* **Layout**: Maintain the left sidebar (category description) and right grid. Clicking any grid cell slides in the **Product Detail Drawer** (`.pdp-drawer`) from the right.
* **Flow**:
  1. Click Grid Cell ➔ Slide in `.pdp-drawer` (renders name, price, 2-line efficacy description, quantity selector, total price, and action buttons).
  2. Click "ADD TO CART" ➔ Close `.pdp-drawer`, add item to `localStorage`, and slide in **Mini-Cart Drawer** (`.cart-drawer`) to display updated cart list.
* **Non-Goals**: Real PG checkout, backend order/user databases. Fully simulated client-side purchase flow.

## 📝 Decision Log

### Decision 1: Detail View Presentation
* **Decided**: Slide-in Product Detail Drawer (`.pdp-drawer`) on grid cell click.
* **Alternatives**:
  * Redirection to separate PDP HTML pages: High maintenance, lost grid context.
  * Sidebar swap: Layout was too restricted for gallery photos and buttons.
  * Centered modal popup: Intrusive visual overlap, did not flow well into the cart slide.
* **Rationale**: Maintains the gallery context, works cleanly on mobile (stacks as bottom-drawer sheet), and creates a premium SPA feel on static pages.

### Decision 2: Markup Integration Strategy
* **Decided**: Dynamic DOM Injection via shared `cart.js`.
* **Alternatives**: Hardcoding drawer DOM structures in every HTML page.
* **Rationale**: Reduces code duplication. A single script manages both drawers, ensuring consistent layout, styling, and transitions across all pages.

### Decision 3: Cart Persistence
* **Decided**: Browser `localStorage`.
* **Alternatives**: Memory state (reset on page reload).
* **Rationale**: Allows users to preserve their shopping cart contents as they navigate between different category detail pages (juice, spread, chips).

---

## 🛠️ Architecture & Data Flow

### 1. HTML Attributes on Grid Cells
Each `.matrix-cell` representing a product will carry unique data attributes:
```html
<div class="matrix-cell clickable-product" 
     data-id="juice-01"
     data-name="JUICE ITEM 01"
     data-price="12000"
     data-img="assets/juice/DSCF6082.JPG"
     data-desc="식물성 유산균이 장 건강을 돕고 피로 물질 배출에 도움을 줍니다.">
  ...
</div>
```

### 2. Stylesheets (`sales.css` / `style.css`)
We will style both drawers:
* **Common Drawer Base**:
  * `position: fixed; top: 0; right: 0; height: 100vh; width: 420px; z-index: 1100; transform: translate3d(100%, 0, 0); transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);`
  * Overlay backdrops with `backdrop-filter: blur(8px)` and smooth fade transition.
* **Mobile Adaptability**:
  * Media queries (`@media (max-width: 576px)`) adjust drawers to `width: 100%; height: 85vh; top: auto; bottom: 0; transform: translate3d(0, 100%, 0); border-radius: 24px 24px 0 0;` (bottom sheet layout).

### 3. JavaScript Module (`cart.js`)
Handles:
- Dynamic creation of `.pdp-drawer`, `.cart-drawer`, and backdrop elements.
- Intercepting clicks on `.clickable-product` cells to populate and open `.pdp-drawer`.
- Quantity increment/decrement triggers, updating subtotal display.
- Adding items to `localStorage` cart state array.
- Redrawing cart list inside `.cart-drawer` (with remove buttons).
- Custom sliding overlay triggers.
