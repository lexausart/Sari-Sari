   // Toast styles
    const style = document.createElement("style");
    style.textContent = `
      .toast{
        position: fixed;
        left: 50%;
        bottom: 18px;
        transform: translate(-50%, 12px);
        opacity: 0;
        pointer-events: none;
        background: rgba(17,24,39,.92);
        color: #fff;
        padding: 10px 12px;
        border-radius: 999px;
        box-shadow: 0 10px 28px rgba(0,0,0,.22);
        font: 800 13px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        z-index: 9999;
        max-width: calc(100vw - 24px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: opacity .18s ease, transform .18s ease;
      }
      .toast--show{ opacity: 1; transform: translate(-50%, 0); }
    `;
    document.head.appendChild(style);

    const norm = (s) => (s ?? "").toString().toLowerCase().replace(/\s+/g, " ").trim();

    function toast(message) {
        const el = document.createElement("div");
        el.className = "toast";
        el.textContent = message;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add("toast--show"));
        setTimeout(() => {
            el.classList.remove("toast--show");
            setTimeout(() => el.remove(), 200);
        }, 1400);
    }

    // Cart
    let cartCount = Number(cartBadge?.textContent || 0);
    function setCartCount(n) {
        cartCount = n;
        if (cartBadge) cartBadge.textContent = String(cartCount);
    }

    grid.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn--add");
        if (!btn) return;

        const card = btn.closest(".card");
        const title = card?.querySelector(".card__title")?.textContent?.trim() || "Item";
        setCartCount(cartCount + 1);
        toast(`Added: ${title}`);
    });

    // Sorting helpers
    const numAttr = (card, name, fallback = 0) => {
        const n = Number(card.getAttribute(name));
        return Number.isFinite(n) ? n : fallback;
    };

    const dateAttr = (card, name, fallback = "1970-01-01") => {
        const t = Date.parse(card.getAttribute(name) || fallback);
        return Number.isFinite(t) ? t : Date.parse(fallback);
    };

    const chaosScore = (card) => {
        const rating = numAttr(card, "data-rating", 0);
        const reviews = numAttr(card, "data-reviews", 0);
        return rating * 1_000_000 + reviews;
    };

    function applySort(mode) {
        const visible = cardsAll.filter((c) => !c.classList.contains("is-hidden"));
        const hidden = cardsAll.filter((c) => c.classList.contains("is-hidden"));

        let ordered;
        if (mode === "featured") {
            ordered = featuredOrder.filter((c) => !c.classList.contains("is-hidden"));
        } else {
            ordered = [...visible].sort((a, b) => {
                if (mode === "priceAsc") return numAttr(a, "data-price") - numAttr(b, "data-price");
                if (mode === "priceDesc") return numAttr(b, "data-price") - numAttr(a, "data-price");
                if (mode === "ratingDesc") return chaosScore(b) - chaosScore(a);
                if (mode === "newest") return dateAttr(b, "data-date") - dateAttr(a, "data-date");
                return 0;
            });
        }

        const frag = document.createDocumentFragment();
        ordered.forEach((c) => frag.appendChild(c));
        hidden.forEach((c) => frag.appendChild(c));
        grid.appendChild(frag);
    }

    if (sortSelect) sortSelect.addEventListener("change", () => applySort(sortSelect.value));

  
    // Initial
    state.q = norm(searchInput?.value || "");
    state.deptDropdown = deptKeyFromDropdown(deptSelect?.value || "All");
    applyAllFilters();
})();

// --- Random RP Hook Generator ---
(() => {
    const btn = document.getElementById("randomHookBtn");
    const box = document.getElementById("randomHookBox");
    const text = document.getElementById("randomHookText");
    if (!btn || !box || !text) return;

    const hooks = [
        "You receive the wrong order. It contains something humming softly.",
        "Tang insists you pay with a story instead of gil.",
        "A trinket glows when you walk past the counter.",
        "Euclid needs help testing something that absolutely will not explode.",
        "Brynley claims you promised him candy.",
        "Sunny hands you a drink and says, 'This one chooses people.'",
        "Tito Whiskey is already mid-sentence when you walk in.",
        "A note pinned to the wall has your name on it.",
        "The shop lights flicker when you enter.",
        "You overhear your own name in a whispered argument.",
        "A delivery crate arrives addressed to you.",
        "Tang greets you like she’s been expecting you.",
        "Someone storms out of the shop just as you arrive.",
        "Brynley is running a 'totally legal' side business.",
        "A shelf collapses at the exact moment you look at it.",
        "R'tehz is still judging you.",
        "Someone's banking information is still on the computer!",
        "Did someone just walk out of the bathroom without washing their hands?",
        "Brynley is quoting questionable brain-rot."
    ];

    btn.addEventListener("click", () => {
        const random = hooks[Math.floor(Math.random() * hooks.length)];
        text.textContent = random;
        box.hidden = false;

        // Re-trigger animation
        box.style.animation = "none";
        box.offsetHeight; // force reflow
        box.style.animation = "";
    });
})();

// =========================
// Real Cart System (localStorage)
// =========================
(() => {
  const CART_KEY = "tangazon_cart_v1";

  // --- DOM bits (safe on pages without cart modal) ---
  const modal = document.getElementById("cartModal");
  const cartBtn = document.querySelector(".cart");
  const cartBadge = document.querySelector(".cart__count");

  const itemsHost = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  const totalEl = document.getElementById("cartTotal");
  const taxEl = document.getElementById("cartEmotionalTax");
  const checkoutBtn = document.getElementById("checkoutBtn");

  // If there is no grid on this page, makes cart modal/badge work
  const grid = document.querySelector(".grid");

  // --- Cart state ---
  /** cart = { [id]: { id, name, price, qty } } */
  let cart = loadCart();

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === "object") ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function formatPeso(n) {
    // Keep it simple: ₱ + integer
    const v = Math.max(0, Math.round(Number(n) || 0));
    return `₱${v}`;
  }

  function cartCount() {
    return Object.values(cart).reduce((sum, it) => sum + (it.qty || 0), 0);
  }

  function cartSubtotal() {
    return Object.values(cart).reduce((sum, it) => sum + (it.price * it.qty), 0);
  }

  function emotionalTax(subtotal) {
    // Comedic but predictable: 3% + ₱7 if subtotal > 0
    if (subtotal <= 0) return 0;
    return Math.round(subtotal * 0.03) + 7;
  }

  function updateBadge() {
    if (!cartBadge) return;
    cartBadge.textContent = String(cartCount());
  }

  function ensureToast(message) {
    
    if (typeof window.toast === "function") return window.toast(message);

    // Minimal inline toast fallback
    const el = document.createElement("div");
    el.textContent = message;
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "18px";
    el.style.transform = "translate(-50%, 12px)";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.background = "rgba(17,24,39,.92)";
    el.style.color = "#fff";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "999px";
    el.style.boxShadow = "0 10px 28px rgba(0,0,0,.22)";
    el.style.font = "800 13px/1.1 system-ui";
    el.style.zIndex = "9999";
    el.style.maxWidth = "calc(100vw - 24px)";
    el.style.whiteSpace = "nowrap";
    el.style.overflow = "hidden";
    el.style.textOverflow = "ellipsis";
    el.style.transition = "opacity .18s ease, transform .18s ease";
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translate(-50%, 0)";
    });

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translate(-50%, 12px)";
      setTimeout(() => el.remove(), 200);
    }, 1200);
  }

  // --- Rendering ---
  function renderCart() {
    updateBadge();
    if (!itemsHost || !totalEl || !taxEl || !emptyEl) return;

    const items = Object.values(cart);
    const subtotal = cartSubtotal();
    const tax = emotionalTax(subtotal);

    totalEl.textContent = formatPeso(subtotal);
    taxEl.textContent = formatPeso(tax);

    if (items.length === 0) {
      itemsHost.innerHTML = "";
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;

    const list = document.createElement("div");
    list.className = "cartList";

    for (const it of items) {
      const row = document.createElement("div");
      row.className = "cartItem";
      row.dataset.id = it.id;

      row.innerHTML = `
        <div class="cartItem__top">
          <div>
            <p class="cartItem__name">${escapeHtml(it.name)}</p>
            <p class="cartItem__meta">Unit price: ${formatPeso(it.price)}</p>
          </div>
          <div class="cartItem__price">${formatPeso(it.price * it.qty)}</div>
        </div>

        <div class="cartItem__controls">
          <div class="qty" aria-label="Quantity controls">
            <button type="button" data-qty="dec" aria-label="Decrease quantity">−</button>
            <span aria-label="Quantity">${it.qty}</span>
            <button type="button" data-qty="inc" aria-label="Increase quantity">+</button>
          </div>

          <button class="cartItem__remove" type="button" data-remove="1">
            Remove (I regret this)
          </button>
        </div>
      `;

      list.appendChild(row);
    }

    itemsHost.innerHTML = "";
    itemsHost.appendChild(list);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // --- Mutations ---
  function addItem({ id, name, price }) {
    if (!id) return;
    const p = Number(price);
    if (!Number.isFinite(p)) return;

    if (!cart[id]) cart[id] = { id, name: name || "Mystery Item", price: Math.round(p), qty: 0 };
    cart[id].qty += 1;

    saveCart();
    renderCart();
  }

  function setQty(id, qty) {
    if (!cart[id]) return;
    const q = Math.max(0, Math.round(Number(qty) || 0));
    if (q === 0) delete cart[id];
    else cart[id].qty = q;

    saveCart();
    renderCart();
  }

  function incQty(id, delta) {
    if (!cart[id]) return;
    setQty(id, cart[id].qty + delta);
  }

  // --- Hook up Add to Cart buttons (delegated) ---
  if (grid) {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn--add");
      if (!btn) return;

      const card = btn.closest(".card");
      if (!card) return;

      const id = card.getAttribute("data-id") || (card.querySelector(".card__title")?.textContent || "").trim();
      const name = card.getAttribute("data-name") || (card.querySelector(".card__title")?.textContent || "Item").trim();
      const price = card.getAttribute("data-price");

      addItem({ id, name, price });
      ensureToast(`Added: ${name}`);
    });
  }

  // --- Cart modal open/close ---
  if (modal && cartBtn) {
    const closeEls = modal.querySelectorAll("[data-cart-close]");
    let lastFocus = null;

    const open = (e) => {
      e.preventDefault();
      lastFocus = document.activeElement;

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("drawer-open"); // reuse scroll-lock class
      renderCart();

      // focus close button
      const closeBtn = modal.querySelector(".cartModal__close");
      closeBtn && closeBtn.focus();
    };

    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("drawer-open");

      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    };

    cartBtn.addEventListener("click", open);
    closeEls.forEach((el) => el.addEventListener("click", close));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });

    // Cart item controls inside modal
    modal.addEventListener("click", (e) => {
      const itemEl = e.target.closest(".cartItem");
      if (!itemEl) return;
      const id = itemEl.dataset.id;

      const qtyBtn = e.target.closest("[data-qty]");
      if (qtyBtn) {
        const dir = qtyBtn.getAttribute("data-qty");
        if (dir === "inc") incQty(id, +1);
        if (dir === "dec") incQty(id, -1);
        return;
      }

      const rmBtn = e.target.closest("[data-remove]");
      if (rmBtn) {
        setQty(id, 0);
        ensureToast("Removed. The cart is now slightly less dramatic.");
      }
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        const subtotal = cartSubtotal();
        if (subtotal <= 0) {
          ensureToast("Checkout denied. Add snacks first.");
          return;
        }
        ensureToast("(go back and add more snacks!!!11!)");
      });
    }
  }

  // Initial badge render on every page load
  renderCart();
})();




// DEALS

(() => {
  const btn = document.getElementById("notSuspiciousBtn");
  const modal = document.getElementById("eventModal");
  if (!btn || !modal) return;

  const titleEl = document.getElementById("eventTitle");
  const badgeEl = document.getElementById("eventBadge");
  const textEl = document.getElementById("eventText");
  const fineEl = document.getElementById("eventFineprint");
  const actionsEl = document.getElementById("eventActions");
  const closeEls = modal.querySelectorAll("[data-event-close]");

  // Where the button *would* normally go:
  const DEALS_ANCHOR = "#shopHooks"; // change to your deals section id if you want
  const goToDeals = () => { window.location.href = "index.html" + DEALS_ANCHOR; };

  // Small helper: weighted random
  const pickWeighted = (items) => {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * total;
    for (const it of items) {
      r -= it.weight;
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  };

  const events = [
    {
      weight: 18,
      badge: "🛡️",
      title: "Security Check (Very Legitimate)",
      text: "Before viewing these deals, please confirm you are not: a rival shopkeeper, an undercover Flames officer, or emotionally fragile.",
      fine: "Passing this check does not mean you are not suspicious.",
      buttons: [
        { label: "I Am Emotionally Stable", kind: "primary", action: "continue" },
        { label: "That’s Between Me and the Moon", kind: "ghost", action: "continue" },
      ],
      onContinueToast: "Verification complete. You are suspicious.",
    },
    {
      weight: 14,
      badge: "🧾",
      title: "Deal Disclaimer Scroll",
      text: "These deals may include: mild chaos, aggressive discounts, and items labeled “Probably Fine.”",
      fine: "By continuing you agree to the Terms of Vibes (Section 3: Emotional Damage).",
      buttons: [
        { label: "Accept Fate", kind: "primary", action: "continue" },
        { label: "Read 72 More Terms", kind: "ghost", action: "moreTerms" },
      ],
    },
    {
      weight: 12,
      badge: "🎰",
      title: "Spin the Suspicion Wheel",
      text: "You spin a wheel. It spins back.",
      fine: "Wheel outcomes are legally considered “suggestions.”",
      buttons: [
        { label: "Spin", kind: "primary", action: "spin" },
        { label: "I Fear Destiny", kind: "ghost", action: "close" },
      ],
    },
    {
      weight: 10,
      badge: "🪄",
      title: "Blessing Required",
      text: "Tang insists on applying a minor blessing before you browse. This may improve your luck. Or complicate your life.",
      fine: "Blessing strength varies with moon phase and flirtation levels.",
      buttons: [
        { label: "Accept Blessing", kind: "primary", action: "bless" },
        { label: "I’ll Risk It", kind: "ghost", action: "continue" },
      ],
    },
    {
      weight: 8,
      badge: "🧃",
      title: "Tito Whiskey Interrupts",
      text: "“Before you proceed, I have advice.”",
      fine: "Advice is non-refundable and may be incorrect on purpose.",
      buttons: [
        { label: "What is it", kind: "primary", action: "advice" },
        { label: "No thank you", kind: "ghost", action: "advice" },
      ],
    },
    {
      weight: 2,
      badge: "✨",
      title: "LEGENDARY DEAL EVENT",
      text: "Bryn has authorized a LIMITED TIME “ABSOLUTELY FINE” discount. Someone is going to regret this.",
      fine: "Congrats. This event has a 2% spawn rate. Your fate is sealed.",
      buttons: [
        { label: "Open the Vault", kind: "primary", action: "continue" },
        { label: "Close It. CLOSE IT.", kind: "ghost", action: "close" },
      ],
    },
  ];

  const toast = (msg) => {
    if (typeof window.toast === "function") return window.toast(msg);

    // Minimal toast fallback
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "18px";
    el.style.transform = "translate(-50%, 12px)";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.background = "rgba(17,24,39,.92)";
    el.style.color = "#fff";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "999px";
    el.style.boxShadow = "0 10px 28px rgba(0,0,0,.22)";
    el.style.font = "800 13px/1.1 system-ui";
    el.style.zIndex = "9999";
    el.style.maxWidth = "calc(100vw - 24px)";
    el.style.whiteSpace = "nowrap";
    el.style.overflow = "hidden";
    el.style.textOverflow = "ellipsis";
    el.style.transition = "opacity .18s ease, transform .18s ease";
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translate(-50%, 0)"; });
    setTimeout(() => {
      el.style.opacity = "0"; el.style.transform = "translate(-50%, 12px)";
      setTimeout(() => el.remove(), 200);
    }, 1200);
  };

  let currentEvent = null;
  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open"); // reuse scroll lock

    // pick event
    currentEvent = pickWeighted(events);
    renderEvent(currentEvent);

    const firstBtn = actionsEl.querySelector("button");
    firstBtn && firstBtn.focus();
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  const renderEvent = (ev) => {
    titleEl.textContent = ev.title;
    badgeEl.textContent = ev.badge || "✨";
    textEl.textContent = ev.text;
    fineEl.textContent = ev.fine || "";

    actionsEl.innerHTML = "";
    ev.buttons.forEach((b) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = b.kind === "primary" ? "btn btn--primary" : "btn btn--ghost";
      btn.textContent = b.label;
      btn.addEventListener("click", () => handleAction(b.action, ev));
      actionsEl.appendChild(btn);
    });
  };

  const handleAction = (action, ev) => {
    if (action === "close") return close();

    if (action === "moreTerms") {
      toast("You scroll. The terms scroll back. Respectfully.");
      fineEl.textContent = (ev.fine || "") + " • Clause 72: snacks are final.";
      return;
    }

    if (action === "spin") {
      const outcomes = [
        "You unlocked 5% off but owe Tang a story.",
        "Free shipping. But Tito watches.",
        "Blessing applied accidentally.",
        "Euclid calibrated your discount (it’s unsettlingly precise).",
        "You won a coupon that only works during a full moon.",
      ];
      const out = outcomes[Math.floor(Math.random() * outcomes.length)];
      toast(out);
      // After spinning once, change primary button to continue
      actionsEl.innerHTML = "";
      const cont = document.createElement("button");
      cont.type = "button";
      cont.className = "btn btn--primary";
      cont.textContent = "Continue (nervously)";
      cont.addEventListener("click", () => handleAction("continue", ev));
      actionsEl.appendChild(cont);

      const nope = document.createElement("button");
      nope.type = "button";
      nope.className = "btn btn--ghost";
      nope.textContent = "I’ve seen enough";
      nope.addEventListener("click", close);
      actionsEl.appendChild(nope);
      return;
    }

    if (action === "bless") {
      const blessings = [
        "Blessing applied: +2 luck, -1 common sense.",
        "Blessing applied: your snacks arrive warm. Emotionally.",
        "Blessing applied: your cart gains narrative tension.",
      ];
      toast(blessings[Math.floor(Math.random() * blessings.length)]);
      return handleAction("continue", ev);
    }

    if (action === "advice") {
      const adv = [
        "Tito says: ‘Buy two. One for you, one for regret.’",
        "Tito says: ‘If it’s labeled “Probably Fine,” it’s DEFINITELY fine.’",
        "Tito says: ‘Never trust discounts that don’t glare back.’",
      ];
      toast(adv[Math.floor(Math.random() * adv.length)]);
      return handleAction("continue", ev);
    }

    if (action === "continue") {
      if (ev.onContinueToast) toast(ev.onContinueToast);
      close();
      // Go to deals 
      goToDeals();
    }
  };

  // Button click opens modal instead of navigating immediately
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });

  // Close clicks
  closeEls.forEach((el) => el.addEventListener("click", close));

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  // Basic focus trap
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key !== "Tab") return;

    const focusables = modal.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

