/**
 * da:bt E-commerce Controller (cart.js)
 * Coordinates PDP Details, Side Drawers, and Standalone Cart Page rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State
  let cart = JSON.parse(localStorage.getItem('dabt_cart')) || [];
  let currentProduct = null;
  const isCartPage = window.location.pathname.endsWith('cart.html');

  // 2. DOM Injection (Drawers & Backdrop - Only on Non-Cart pages for clean UX,
  // but we can inject them universally or dynamically target)
  injectDrawerElements();
  injectCustomModal();

  // 3. Cache DOM Elements
  const backdrop = document.querySelector('.drawer-backdrop');
  const pdpDrawer = document.querySelector('.pdp-drawer');
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartItemsList = document.querySelector('.cart-items-list');
  const cartEmptyState = document.querySelector('.cart-empty-state');
  const cartPageContent = document.querySelector('.cart-page-content');

  // Dynamic header nav link handling
  injectCartNavButton();
  const cartToggleBtns = document.querySelectorAll('.cart-toggle-btn');

  // Update Initial UI States
  updateCartIndicators();
  if (isCartPage) {
    renderCartPage();
  }

  // 4. Bind Global Event Listeners

  // Close buttons & Backdrop clicks (if drawers exist)
  document.querySelectorAll('.drawer-close-btn').forEach(btn => {
    btn.addEventListener('click', closeAllDrawers);
  });
  if (backdrop) {
    backdrop.addEventListener('click', closeAllDrawers);
  }

  // CART nav link — always navigates to cart.html (no drawer intercept)

  // Intercept click on product grid cells
  const productCells = document.querySelectorAll('.clickable-product');
  productCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const id = cell.getAttribute('data-id');
      const name = cell.getAttribute('data-name');
      const price = parseInt(cell.getAttribute('data-price'), 10);
      const img = cell.getAttribute('data-img');
      const desc = cell.getAttribute('data-desc') || '';

      currentProduct = { id, name, price, img, desc, quantity: 1 };

      openPdpDrawer(currentProduct);
    });
  });

  // PDP Quantity Modifiers (if pdpDrawer exists)
  if (pdpDrawer) {
    const pdpMinusBtn = pdpDrawer.querySelector('.qty-minus');
    const pdpPlusBtn = pdpDrawer.querySelector('.qty-plus');
    const pdpValueSpan = pdpDrawer.querySelector('.qty-value');
    const pdpTotalPriceVal = pdpDrawer.querySelector('.total-price-value');
    const addToCartBtn = pdpDrawer.querySelector('.pdp-add-to-cart-btn');

    pdpMinusBtn.addEventListener('click', () => {
      if (currentProduct && currentProduct.quantity > 1) {
        currentProduct.quantity--;
        updatePdpQuantityUI();
      }
    });

    pdpPlusBtn.addEventListener('click', () => {
      if (currentProduct) {
        currentProduct.quantity++;
        updatePdpQuantityUI();
      }
    });

    addToCartBtn.addEventListener('click', () => {
      if (currentProduct) {
        addToCart(currentProduct);
        closePdpDrawer();
        showCustomModal('장바구니에 상품이 담겼습니다.', true, () => {
          setTimeout(openCartDrawer, 400); // Smooth transition: wait for PDP to slide out
        });
      }
    });

    function updatePdpQuantityUI() {
      pdpValueSpan.textContent = currentProduct.quantity;
      pdpTotalPriceVal.textContent = formatPrice(currentProduct.price * currentProduct.quantity);
    }
  }

  // Mini-Cart Drawer Checkout (if cartDrawer exists)
  if (cartDrawer) {
    const checkoutBtn = cartDrawer.querySelector('.cart-checkout-btn');
    checkoutBtn.addEventListener('click', () => {
      handleCheckout();
    });
  }

  // 5. Shared Functions & Actions

  function injectDrawerElements() {
    // Backdrop
    if (!document.querySelector('.drawer-backdrop')) {
      const bd = document.createElement('div');
      bd.className = 'drawer-backdrop';
      document.body.appendChild(bd);
    }

    // PDP Drawer
    if (!document.querySelector('.pdp-drawer')) {
      const pdp = document.createElement('div');
      pdp.className = 'pdp-drawer';
      pdp.innerHTML = `
        <button class="drawer-close-btn">&times;</button>
        <div class="pdp-drawer-content">
          <div class="pdp-img-container">
            <img src="" alt="" class="pdp-image">
          </div>
          <div class="pdp-info-container">
            <h2 class="pdp-title"></h2>
            <div class="pdp-price"></div>
            <p class="pdp-desc"></p>
            
            <div class="qty-selector-wrapper">
              <span class="qty-label">QUANTITY</span>
              <div class="qty-counter">
                <button class="qty-btn qty-minus">-</button>
                <span class="qty-value">1</span>
                <button class="qty-btn qty-plus">+</button>
              </div>
            </div>
          </div>
        </div>
        <div class="pdp-footer">
          <div class="pdp-total-price-wrap">
            <span class="total-label">TOTAL</span>
            <span class="total-price-value">0₩</span>
          </div>
          <button class="pdp-add-to-cart-btn">ADD TO CART</button>
        </div>
      `;
      document.body.appendChild(pdp);
    }

    // Cart Drawer (Only needed if NOT on cart.html)
    if (!isCartPage && !document.querySelector('.cart-drawer')) {
      const cd = document.createElement('div');
      cd.className = 'cart-drawer';
      cd.innerHTML = `
        <div class="cart-drawer-header">
          <span class="cart-drawer-title">CART</span>
          <button class="drawer-close-btn">&times;</button>
        </div>
        <div class="cart-drawer-content">
          <div class="cart-empty-state">Your cart is empty.</div>
          <ul class="cart-items-list"></ul>
        </div>
        <div class="cart-footer">
          <div class="cart-total-price-wrap">
            <span class="total-label">TOTAL</span>
            <span class="total-price-value">0₩</span>
          </div>
          <button class="cart-checkout-btn">CHECKOUT</button>
        </div>
      `;
      document.body.appendChild(cd);
    }
  }

  function injectCustomModal() {
    if (!document.querySelector('.custom-modal-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'custom-modal-overlay';
      overlay.innerHTML = `
        <div class="custom-modal-container">
          <div class="custom-modal-icon-wrap">
            <span class="custom-modal-icon">✓</span>
          </div>
          <div class="custom-modal-message"></div>
          <button class="custom-modal-btn">확인</button>
        </div>
      `;
      document.body.appendChild(overlay);

      // Bind close action
      const btn = overlay.querySelector('.custom-modal-btn');
      btn.addEventListener('click', () => {
        closeCustomModal();
      });
    }
  }

  let activeModalCallback = null;

  function showCustomModal(message, isSuccess = true, callback = null) {
    const overlay = document.querySelector('.custom-modal-overlay');
    if (!overlay) return;

    const icon = overlay.querySelector('.custom-modal-icon');
    const iconWrap = overlay.querySelector('.custom-modal-icon-wrap');
    const msgEl = overlay.querySelector('.custom-modal-message');

    msgEl.textContent = message;
    activeModalCallback = callback;

    if (isSuccess) {
      icon.textContent = '✓';
      iconWrap.style.background = 'transparent';
      iconWrap.style.border = '1px solid #000000';
      iconWrap.style.color = '#000000';
      iconWrap.style.boxShadow = 'none';
    } else {
      icon.textContent = '!';
      iconWrap.style.background = 'transparent';
      iconWrap.style.border = '1px solid #ff3b30';
      iconWrap.style.color = '#ff3b30';
      iconWrap.style.boxShadow = 'none';
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCustomModal() {
    const overlay = document.querySelector('.custom-modal-overlay');
    if (!overlay) return;

    overlay.classList.remove('open');
    document.body.style.overflow = '';

    if (activeModalCallback) {
      const cb = activeModalCallback;
      activeModalCallback = null;
      cb();
    }
  }

  function injectCartNavButton() {
    const nav = document.querySelector('.products-nav');
    if (nav) {
      const cartLink = nav.querySelector('a[href="cart.html"]');
      if (cartLink) {
        // Keep as normal nav-item link — no drawer intercept
        // Just add cart count indicator
        cartLink.innerHTML = `CART (<span class="cart-count">0</span>)`;
      }
    }
  }

  function openPdpDrawer(prod) {
    if (!pdpDrawer) return;
    pdpDrawer.querySelector('.pdp-image').src = prod.img;
    pdpDrawer.querySelector('.pdp-image').alt = prod.name;
    pdpDrawer.querySelector('.pdp-title').textContent = prod.name;
    pdpDrawer.querySelector('.pdp-price').textContent = formatPrice(prod.price);
    pdpDrawer.querySelector('.pdp-desc').textContent = prod.desc;

    // reset pdp qty counters
    pdpDrawer.querySelector('.qty-value').textContent = prod.quantity;
    pdpDrawer.querySelector('.total-price-value').textContent = formatPrice(prod.price * prod.quantity);

    closeCartDrawer();
    backdrop.classList.add('open');
    pdpDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePdpDrawer() {
    if (!pdpDrawer) return;
    pdpDrawer.classList.remove('open');
    if (!cartDrawer || !cartDrawer.classList.contains('open')) {
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function openCartDrawer() {
    if (!cartDrawer) return;
    renderCartItems();
    closePdpDrawer();
    backdrop.classList.add('open');
    cartDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    if (!pdpDrawer || !pdpDrawer.classList.contains('open')) {
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function closeAllDrawers() {
    closePdpDrawer();
    closeCartDrawer();
  }

  function addToCart(prod) {
    const existing = cart.find(item => item.id === prod.id);
    if (existing) {
      existing.quantity += prod.quantity;
    } else {
      cart.push({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        img: prod.img,
        quantity: prod.quantity
      });
    }
    saveCart();
    updateCartIndicators();
    if (isCartPage) {
      renderCartPage();
    }
  }

  function saveCart() {
    localStorage.setItem('dabt_cart', JSON.stringify(cart));
  }

  function updateCartIndicators() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
    });
  }

  // Render list inside side drawer
  function renderCartItems() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';

    if (cart.length === 0) {
      cartEmptyState.style.display = 'block';
      cartDrawer.querySelector('.cart-footer').style.display = 'none';
      return;
    }

    cartEmptyState.style.display = 'none';
    cartDrawer.querySelector('.cart-footer').style.display = 'block';

    let grandTotal = 0;

    cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      grandTotal += itemTotal;

      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item-img-wrap">
          <img src="${item.img}" alt="${item.name}">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-meta">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">${formatPrice(item.price)}</span>
          </div>
          <div class="cart-item-actions">
            <div class="cart-qty-counter">
              <button class="cart-qty-btn cart-qty-minus" data-index="${index}">&minus;</button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button class="cart-qty-btn cart-qty-plus" data-index="${index}">&plus;</button>
            </div>
            <button class="cart-item-remove-btn" data-index="${index}">REMOVE</button>
          </div>
        </div>
      `;
      cartItemsList.appendChild(li);
    });

    cartDrawer.querySelector('.cart-total-price-value').textContent = formatPrice(grandTotal);

    // Bind item levels
    cartItemsList.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (cart[idx].quantity > 1) {
          cart[idx].quantity--;
          saveCart();
          updateCartIndicators();
          renderCartItems();
        }
      });
    });

    cartItemsList.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        cart[idx].quantity++;
        saveCart();
        updateCartIndicators();
        renderCartItems();
      });
    });

    cartItemsList.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        cart.splice(idx, 1);
        saveCart();
        updateCartIndicators();
        renderCartItems();
      });
    });
  }

  // 6. Standalone Cart Page Specific Renderer
  function renderCartPage() {
    if (!cartPageContent) return;
    cartPageContent.innerHTML = '';

    if (cart.length === 0) {
      cartPageContent.innerHTML = `
        <div class="cart-page-empty-wrap">
          <p class="cart-page-empty-msg">Your cart is empty.</p>
          <a href="products.html" class="cart-page-shop-btn">GO SHOPPING</a>
        </div>
      `;
      return;
    }

    let subTotal = 0;

    // Create elements
    const wrapper = document.createElement('div');
    wrapper.className = 'cart-page-table-wrapper';

    let itemsHTML = '';
    cart.forEach((item, index) => {
      const rowTotal = item.price * item.quantity;
      subTotal += rowTotal;

      itemsHTML += `
        <div class="cart-page-item-row">
          <div class="cart-page-item-info">
            <div class="cart-page-item-img-wrap">
              <img src="${item.img}" alt="${item.name}">
            </div>
            <div class="cart-page-item-meta">
              <span class="cart-page-item-name">${item.name}</span>
              <span class="cart-page-item-price">${formatPrice(item.price)}</span>
              <button class="cart-page-item-remove" data-index="${index}">REMOVE</button>
            </div>
          </div>
          <div class="cart-page-item-qty">
            <div class="qty-counter">
              <button class="qty-btn page-qty-minus" data-index="${index}">&minus;</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn page-qty-plus" data-index="${index}">&plus;</button>
            </div>
          </div>
          <div class="cart-page-item-total">
            ${formatPrice(rowTotal)}
          </div>
        </div>
      `;
    });

    wrapper.innerHTML = `
      <div class="cart-page-table-header">
        <span class="col-product">PRODUCT</span>
        <span class="col-qty">QUANTITY</span>
        <span class="col-total">TOTAL</span>
      </div>
      <div class="cart-page-items-list">
        ${itemsHTML}
      </div>
      <div class="cart-page-summary-wrapper">
        <div class="cart-page-summary-row">
          <span class="summary-label">SUBTOTAL</span>
          <span class="summary-value">${formatPrice(subTotal)}</span>
        </div>
        <div class="cart-page-summary-row text-secondary">
          <span class="summary-label">SHIPPING</span>
          <span class="summary-value">FREE</span>
        </div>
        <hr class="summary-divider">
        <div class="cart-page-summary-row grand-total">
          <span class="summary-label">TOTAL</span>
          <span class="summary-value">${formatPrice(subTotal)}</span>
        </div>
        <button class="cart-page-checkout-btn">PROCEED TO CHECKOUT</button>
      </div>
    `;

    cartPageContent.appendChild(wrapper);

    // Bind event listeners for the standalone page
    cartPageContent.querySelectorAll('.page-qty-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        if (cart[idx].quantity > 1) {
          cart[idx].quantity--;
          saveCart();
          updateCartIndicators();
          renderCartPage();
        }
      });
    });

    cartPageContent.querySelectorAll('.page-qty-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        cart[idx].quantity++;
        saveCart();
        updateCartIndicators();
        renderCartPage();
      });
    });

    cartPageContent.querySelectorAll('.cart-page-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        cart.splice(idx, 1);
        saveCart();
        updateCartIndicators();
        renderCartPage();
      });
    });

    const pageCheckoutBtn = cartPageContent.querySelector('.cart-page-checkout-btn');
    if (pageCheckoutBtn) {
      pageCheckoutBtn.addEventListener('click', () => {
        handleCheckout();
      });
    }
  }

  function handleCheckout() {
    if (cart.length === 0) {
      showCustomModal('장바구니가 비어 있습니다.', false);
      return;
    }

    showCustomModal('주문이 완료되었습니다! da:bt를 선택해주셔서 감사합니다.', true, () => {
      cart = [];
      saveCart();
      updateCartIndicators();
      if (isCartPage) {
        renderCartPage();
      } else {
        renderCartItems();
        closeAllDrawers();
      }
    });
  }

  function formatPrice(num) {
    return num.toLocaleString() + '₩';
  }
});
