"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

 type Branch = {
  id: string;
  name: string;
  shortName: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  openingHours: string | null;
  directionsUrl: string | null;
  imageUrl: string | null;
};

type Option = { label: string; price: number };
type MenuRow = {
  branchId: string;
  price: number;
  isAvailable: boolean;
  itemId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  options: Option[];
  isFeatured: boolean;
  isPopular: boolean;
  categoryName: string | null;
  categorySlug: string | null;
};
type CartItem = { key: string; item: MenuRow; optionLabel?: string; unitPrice: number; quantity: number };

type IconName = "arrow" | "search" | "cart" | "pin" | "phone" | "clock" | "check" | "spark" | "menu" | "close";
function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "arrow") return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.6" /><path d="m16 16 4.5 4.5" /></svg>;
  if (name === "cart") return <svg {...common}><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L20 8H6" /><circle cx="9" cy="19.5" r="1" /><circle cx="17" cy="19.5" r="1" /></svg>;
  if (name === "pin") return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === "phone") return <svg {...common}><path d="M6.3 3.5 9 6.2 7.2 8a14.4 14.4 0 0 0 8.8 8.8l1.8-1.8 2.7 2.7-1.5 1.5c-.8.8-2 1.1-3.1.7C9.8 17.8 6.2 14.2 4.1 8.1c-.4-1.1-.1-2.3.7-3.1l1.5-1.5Z" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4.4 4.4L19 7" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function Logo({ light = true }: { light?: boolean }) {
  return <a href="#top" className="brand" aria-label="King’ang’i Hotel home"><span className="brand-mark">K</span><span className="brand-copy" style={{ color: light ? "white" : "var(--ink)" }}>KING’ANG’I<small>HOTEL · NANYUKI ROAD</small></span></a>;
}

const formatCurrency = (amount: number) => `KSh ${new Intl.NumberFormat("en-KE").format(amount)}`;
const digitsOnly = (value: string) => value.replace(/\D/g, "");

export default function HomePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [menu, setMenu] = useState<MenuRow[]>([]);
  const [activeBranchId, setActiveBranchId] = useState("");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuRow | null>(null);
  const [toast, setToast] = useState("");
  const [customer, setCustomer] = useState({ fullName: "", phone: "", email: "", orderType: "collection", preferredTime: "", specialInstructions: "" });
  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{ orderNumber: string; total: number; branchName: string; whatsapp: string | null } | null>(null);
  const [inquiry, setInquiry] = useState({ fullName: "", phone: "", email: "", branchId: "", message: "" });
  const [inquiryState, setInquiryState] = useState("");
  const [tracking, setTracking] = useState({ orderNumber: "", phone: "" });
  const [trackingState, setTrackingState] = useState<{ orderNumber?: string; status?: string; branchName?: string; total?: number; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/menu").then((response) => response.json()).then((data) => {
      if (data.branches) {
        setBranches(data.branches);
        setActiveBranchId(data.branches[0]?.id ?? "");
        setInquiry((current) => ({ ...current, branchId: data.branches[0]?.id ?? "" }));
      }
      setMenu(data.menu ?? []);
    }).catch(() => setToast("The menu is taking a little longer to load.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeBranch = branches.find((branch) => branch.id === activeBranchId) ?? branches[0];
  const branchMenu = useMemo(() => menu.filter((item) => item.branchId === activeBranchId), [menu, activeBranchId]);
  const categories = useMemo(() => Array.from(new Map(branchMenu.filter((item) => item.categorySlug).map((item) => [item.categorySlug as string, item.categoryName ?? ""])).entries()), [branchMenu]);
  const featured = useMemo(() => branchMenu.filter((item) => item.isFeatured || item.isPopular).slice(0, 4), [branchMenu]);
  const filteredMenu = useMemo(() => branchMenu.filter((item) => {
    const searchMatches = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    const categoryMatches = category === "all" || item.categorySlug === category;
    return searchMatches && categoryMatches;
  }), [branchMenu, category, search]);
  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuRow, option?: Option) => {
    if (!item.isAvailable) return;
    if (item.options.length && !option) {
      setPendingItem(item);
      return;
    }
    const unitPrice = option?.price ?? item.price;
    const key = `${item.itemId}-${option?.label ?? "default"}`;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) return current.map((line) => line.key === key ? { ...line, quantity: Math.min(line.quantity + 1, 20) } : line);
      return [...current, { key, item, optionLabel: option?.label, unitPrice, quantity: 1 }];
    });
    setPendingItem(null);
    setCartOpen(true);
  };

  const updateQuantity = (key: string, change: number) => setCart((current) => current.map((line) => line.key === key ? { ...line, quantity: line.quantity + change } : line).filter((line) => line.quantity > 0));

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeBranch || !cart.length) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branchId: activeBranch.id, customer: customer, orderType: customer.orderType, preferredTime: customer.preferredTime, specialInstructions: customer.specialInstructions, items: cart.map((line) => ({ menuItemId: line.item.itemId, quantity: line.quantity, optionLabel: line.optionLabel })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Order could not be placed");
      setOrderConfirmation(data.order);
      setCart([]);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitInquiry = async (event: FormEvent) => {
    event.preventDefault();
    setInquiryState("Sending...");
    const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inquiry) });
    setInquiryState(response.ok ? "Message sent — thank you. We’ll be in touch." : "We could not send that message. Please try again.");
    if (response.ok) setInquiry((current) => ({ ...current, fullName: "", phone: "", email: "", message: "" }));
  };

  const trackOrder = async (event: FormEvent) => {
    event.preventDefault();
    setTrackingState(null);
    const response = await fetch(`/api/orders?orderNumber=${encodeURIComponent(tracking.orderNumber.trim())}&phone=${encodeURIComponent(tracking.phone.trim())}`);
    const data = await response.json();
    setTrackingState(response.ok ? data.order : { error: data.error });
  };

  return <div id="top">
    <header className="site-nav">
      <div className="shell nav-inner">
        <Logo />
        <nav className={`nav-links ${mobileNav ? "open" : ""}`}>
          <a href="#story" onClick={() => setMobileNav(false)}>About us</a>
          <a href="#menu" onClick={() => setMobileNav(false)}>Menu</a>
          <a href="#branches" onClick={() => setMobileNav(false)}>Our branches</a>
          <a href="#gallery" onClick={() => setMobileNav(false)}>Gallery</a>
          <a href="#contact" onClick={() => setMobileNav(false)}>Contact</a>
        </nav>
        <div className="nav-actions"><a href="#menu" className="btn btn-lime btn-sm">Order now <Icon name="arrow" size={14} /></a><a href="/staff/login" className="btn btn-ghost btn-sm">Staff login</a><button className="nav-menu" aria-label="Open menu" onClick={() => setMobileNav(!mobileNav)}><Icon name={mobileNav ? "close" : "menu"} /></button></div>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="shell hero-content"><div className="hero-copy"><div className="eyebrow">Njoro · Nakuru County · Kenya</div><h1 className="serif display-title">Welcome to<br /><span style={{ color: "var(--lime)" }}>King’ang’i</span> Hotel.</h1><p className="hero-subtitle">Delicious Meals. Great Moments. Warm Hospitality. From the first spoonful to the last laugh, there is always a place for you at our table.</p><div className="hero-buttons"><a href="#menu" className="btn btn-lime">Explore our menu <Icon name="arrow" size={15} /></a><a href="#branches" className="btn btn-ghost">Our locations</a></div><div className="hero-note"><span className="note-line" /> <span>Freshly prepared daily · open to everyone</span></div></div></div><div className="hero-float"><strong>Today at King’ang’i</strong><span>Two welcoming branches. One shared love for generous, honest Kenyan food.</span></div>
      </section>
      <div className="intro-strip"><div className="shell intro-strip-inner"><div className="strip-item"><span>✦</span> Freshly prepared meals</div><div className="strip-item"><span>◌</span> Friendly, familiar service</div><div className="strip-item"><span>◈</span> Two easy-to-reach branches</div><div className="strip-item"><span>✓</span> Order for collection</div></div></div>

      <section className="section" id="featured"><div className="shell"><div className="section-head"><div><div className="section-tag">The King’ang’i table</div><h2 className="serif section-title" style={{ margin: "13px 0 0" }}>Favourites, served<br />with a little more care.</h2></div><p>Our menu is rooted in the Kenyan meals we know and love — warm, generous and made for real everyday moments.</p></div><div className="meal-grid">{loading ? <div className="empty-state">Loading today’s menu…</div> : featured.map((item) => <MealCard key={item.itemId} item={item} onAdd={addToCart} />)}</div></div></section>

      <section className="section section-dark" id="menu"><div className="shell"><div className="section-head"><div><div className="section-tag">Digital menu · <span style={{ color: "var(--gold)" }}>{activeBranch?.shortName ?? "Choose a branch"}</span></div><h2 className="serif section-title" style={{ margin: "13px 0 0" }}>Good food does<br />not need a long story.</h2></div><p>Choose your branch to see its current menu and prices. Prices are in Kenyan shillings and availability is updated by our team.</p></div><div className="menu-controls"><div className="search-wrap"><span className="search-icon"><Icon name="search" size={17} /></span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meals, sides or drinks" aria-label="Search menu" /></div>{categories.map(([slug, name]) => <button key={slug} className={`filter-pill ${category === slug ? "active" : ""}`} onClick={() => setCategory(category === slug ? "all" : slug)}>{name}</button>)}</div><div className="meal-grid">{filteredMenu.length ? filteredMenu.map((item) => <MealCard key={`${item.branchId}-${item.itemId}`} item={item} onAdd={addToCart} dark />) : <div className="empty-state" style={{ color: "#aab5ad", borderColor: "rgba(255,255,255,.18)" }}>No meals match that search. Try another favourite.</div>}</div></div></section>

      <section className="section" id="story"><div className="shell split-story"><div className="story-photo"><img src="https://images.pexels.com/photos/28736731/pexels-photo-28736731.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1100&h=950" alt="A generous buffet in a warm dining setting" /><img src="https://images.pexels.com/photos/5835339/pexels-photo-5835339.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800" alt="A guest enjoying a meal" /></div><div className="story-copy"><div className="eyebrow" style={{ color: "#8cae16" }}>More than a meal</div><h2 className="serif section-title">A familiar place<br />to land.</h2><p>King’ang’i Hotel brings together the food, pace and friendliness of a good Kenyan neighbourhood kitchen. Whether you are passing through, meeting a friend or just hungry for a proper plate, we keep the welcome warm and the food honest.</p><p>Our history, mission and vision are being refined with the hotel team so every word here reflects the people who built King’ang’i. For now, know this: you are welcome at both branches.</p><div className="story-points"><div className="story-point"><span className="point-icon"><Icon name="spark" size={15} /></span><div><strong>Made fresh</strong><span>Every plate starts with care in our kitchen.</span></div></div><div className="story-point"><span className="point-icon"><Icon name="check" size={15} /></span><div><strong>Fair & familiar</strong><span>Comforting food at everyday prices.</span></div></div><div className="story-point"><span className="point-icon"><Icon name="pin" size={15} /></span><div><strong>Two branches</strong><span>Egerton Main Gate and Njokerio.</span></div></div><div className="story-point"><span className="point-icon"><Icon name="phone" size={15} /></span><div><strong>Here to help</strong><span>Call or WhatsApp the branch you prefer.</span></div></div></div></div></div></section>

      <section className="section section-dark" id="branches"><div className="shell"><div className="section-head"><div><div className="section-tag">Find your table</div><h2 className="serif section-title" style={{ margin: "13px 0 0" }}>Two branches.<br />Same warm welcome.</h2></div><p>Start your order by choosing the branch that works best for you. Contact details and map directions can be updated by the hotel team.</p></div><div className="branch-grid">{branches.map((branch, index) => <article key={branch.id} className="branch-card" style={{ "--branch-image": `url(${branch.imageUrl})` } as React.CSSProperties}><div className="branch-content"><div className="branch-index">0{index + 1} · King’ang’i Hotel</div><h3 className="serif">{branch.name}</h3><p>{branch.address}</p><div className="branch-footer"><span className="branch-hours"><Icon name="clock" size={13} /> &nbsp;{branch.openingHours}</span><button className="btn btn-lime btn-sm" onClick={() => { setActiveBranchId(branch.id); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}>Order here <Icon name="arrow" size={13} /></button></div></div></article>)}</div></div></section>

      <section className="section" id="gallery"><div className="shell"><div className="section-head"><div><div className="section-tag" style={{ color: "#8cae16" }}>From our table</div><h2 className="serif section-title" style={{ margin: "13px 0 0" }}>Food that feels<br />like home.</h2></div><p>Authentic plates, generous servings and spaces made for everyday Kenyan hospitality.</p></div><div className="gallery-grid"><Gallery image="https://images.pexels.com/photos/5410401/pexels-photo-5410401.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=1000" caption="Pilau, made to gather around" /><Gallery image="https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700" caption="A proper plate" /><Gallery image="https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700" caption="Something warm" /><Gallery image="https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700" caption="Made with care" /><Gallery image="https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700" caption="Your table is ready" /></div></div></section>

      <section className="section contact-section" id="contact"><div className="shell contact-grid"><div><div className="eyebrow" style={{ color: "#8cae16" }}>Talk to us</div><h2 className="serif section-title" style={{ margin: "13px 0 0" }}>Questions?<br />We are listening.</h2><p style={{ color: "#6b776e", fontSize: 14, lineHeight: 1.7, marginTop: 19 }}>For menu questions, group orders or anything else, choose a branch and send us a note.</p><div className="contact-details"><div className="contact-detail"><span className="point-icon"><Icon name="pin" size={16} /></span><div><strong>Visit us</strong><span>Egerton Main Gate · Njokerio Centre</span></div></div><div className="contact-detail"><span className="point-icon"><Icon name="clock" size={16} /></span><div><strong>Opening hours</strong><span>Daily · 7:00 AM – 10:00 PM</span></div></div><div className="contact-detail"><span className="point-icon"><Icon name="phone" size={16} /></span><div><strong>Call or WhatsApp</strong><span>Use the branch number shown at checkout</span></div></div></div><div style={{ marginTop: 32 }}><div className="eyebrow" style={{ color: "#8cae16" }}>Track a website order</div><form onSubmit={trackOrder} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}><input value={tracking.orderNumber} onChange={(e) => setTracking({ ...tracking, orderNumber: e.target.value })} placeholder="Order ref · KH-..." style={{ border: "1px solid #dbe4dc", borderRadius: 99, padding: "11px 13px", flex: "1 1 160px", outline: "none" }} /><input value={tracking.phone} onChange={(e) => setTracking({ ...tracking, phone: e.target.value })} placeholder="Phone number" style={{ border: "1px solid #dbe4dc", borderRadius: 99, padding: "11px 13px", flex: "1 1 130px", outline: "none" }} /><button className="btn btn-dark btn-sm">Check status</button></form>{trackingState && <p style={{ fontSize: 12, color: trackingState.error ? "#a15353" : "#5f7821", marginTop: 10 }}>{trackingState.error ?? `${trackingState.orderNumber ?? "Order"} is ${trackingState.status}. ${trackingState.branchName ?? ""}`}</p>}</div></div><div className="form-card"><div className="eyebrow" style={{ color: "#8cae16" }}>Send an enquiry</div><h3 className="serif" style={{ fontSize: 27, margin: "8px 0 20px" }}>How can we make<br />your day better?</h3><form className="form-grid" onSubmit={submitInquiry}><div className="form-field"><label htmlFor="contact-name">Your name</label><input id="contact-name" required value={inquiry.fullName} onChange={(e) => setInquiry({ ...inquiry, fullName: e.target.value })} placeholder="Full name" /></div><div className="form-field"><label htmlFor="contact-phone">Phone</label><input id="contact-phone" value={inquiry.phone} onChange={(e) => setInquiry({ ...inquiry, phone: e.target.value })} placeholder="07xx xxx xxx" /></div><div className="form-field"><label htmlFor="contact-email">Email <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label><input id="contact-email" type="email" value={inquiry.email} onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })} placeholder="you@example.com" /></div><div className="form-field"><label htmlFor="contact-branch">Branch</label><select id="contact-branch" value={inquiry.branchId} onChange={(e) => setInquiry({ ...inquiry, branchId: e.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.shortName}</option>)}</select></div><div className="form-field full"><label htmlFor="contact-message">Message</label><textarea id="contact-message" required value={inquiry.message} onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })} placeholder="Tell us what you need help with…" /></div><div className="form-field full"><button className="btn btn-dark" disabled={inquiryState === "Sending..."}>{inquiryState || "Send message"} {!inquiryState && <Icon name="arrow" size={15} />}</button></div></form></div></div></section>
    </main>

    <footer className="site-footer"><div className="shell"><div className="footer-grid"><div className="footer-brand"><Logo /><p>A welcoming Kenyan kitchen in Njoro, serving generous meals, good energy and warm hospitality across two branches.</p></div><div className="footer-col"><h4>Explore</h4><a href="#story">About us</a><a href="#menu">Digital menu</a><a href="#branches">Our branches</a><a href="#gallery">Gallery</a></div><div className="footer-col"><h4>Find us</h4><span>Egerton Main Gate</span><span>Njokerio Centre</span><span>Daily · 7:00 AM – 10:00 PM</span></div><div className="footer-col"><h4>For staff</h4><a href="/staff/login">Staff login</a><a href="#contact">Contact the hotel</a><span>© 2026 King’ang’i Hotel.</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} King’ang’i Hotel. All rights reserved.</span><span>Fresh food · warm welcome · two branches</span></div></div></footer>

    {cartCount > 0 && !cartOpen && <button className="cart-bubble" onClick={() => setCartOpen(true)}><Icon name="cart" size={17} /> Your order <span className="cart-count">{cartCount}</span><strong>{formatCurrency(cartTotal)}</strong></button>}
    {pendingItem && <div className="overlay" onClick={() => setPendingItem(null)}><div className="drawer" style={{ height: "auto", alignSelf: "center", maxHeight: "90vh", borderRadius: 16, margin: 15 }} onClick={(e) => e.stopPropagation()}><div className="drawer-head"><div><div className="eyebrow" style={{ color: "#8cae16" }}>Choose a serving</div><h2>{pendingItem.name}</h2></div><button className="close-button" onClick={() => setPendingItem(null)}>×</button></div><div className="option-picker">{pendingItem.options.map((option) => <button className="option-choice" key={option.label} onClick={() => addToCart(pendingItem, option)}><strong>{option.label}</strong><span>{formatCurrency(option.price)} <Icon name="arrow" size={13} /></span></button>)}</div></div></div>}
    {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><div><div className="eyebrow" style={{ color: "#8cae16" }}>Your order · {activeBranch?.shortName}</div><h2>{orderConfirmation ? "Order received" : "Ready when you are."}</h2></div><button className="close-button" onClick={() => setCartOpen(false)}>×</button></div>{orderConfirmation ? <div className="success-card"><h3>Thank you, {customer.fullName || "friend"}.</h3><p>Your order <strong>{orderConfirmation.orderNumber}</strong> has been sent to {orderConfirmation.branchName}. Keep the reference to check progress.</p><a className="btn btn-dark" target="_blank" rel="noreferrer" href={`https://wa.me/${digitsOnly(orderConfirmation.whatsapp || "254700000000")}?text=${encodeURIComponent(`Hello King’ang’i Hotel, I have just placed order ${orderConfirmation.orderNumber}. Please confirm when ready.`)}`}>Send to WhatsApp <Icon name="arrow" size={14} /></a></div> : <><div className="drawer-section-title">Selected meals</div>{cart.length ? cart.map((line) => <div className="cart-line" key={line.key}><div><h4>{line.item.name}</h4><p>{line.optionLabel ? `${line.optionLabel} · ` : ""}{formatCurrency(line.unitPrice)} each</p></div><div style={{ textAlign: "right" }}><strong style={{ fontSize: 13 }}>{formatCurrency(line.unitPrice * line.quantity)}</strong><div className="quantity-controls" style={{ marginTop: 7 }}><button onClick={() => updateQuantity(line.key, -1)}>−</button><span style={{ fontSize: 12 }}>{line.quantity}</span><button onClick={() => updateQuantity(line.key, 1)}>+</button></div></div></div>) : <p style={{ color: "#758178", fontSize: 13 }}>Your order is empty. Add a favourite from the menu.</p>}<div className="drawer-total"><span>Total</span><strong>{formatCurrency(cartTotal)}</strong></div>{cart.length > 0 && <form className="drawer-form" onSubmit={submitOrder}><div className="drawer-section-title">Your details</div><input required value={customer.fullName} onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })} placeholder="Full name" /><input required minLength={7} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone number" /><input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="Email (optional)" /><select value={customer.orderType} onChange={(e) => setCustomer({ ...customer, orderType: e.target.value })}><option value="collection">Collection at branch</option><option value="delivery">Delivery · confirm with branch</option></select><input value={customer.preferredTime} onChange={(e) => setCustomer({ ...customer, preferredTime: e.target.value })} placeholder="Preferred collection time (optional)" /><textarea value={customer.specialInstructions} onChange={(e) => setCustomer({ ...customer, specialInstructions: e.target.value })} placeholder="Special instructions (optional)" /><button className="btn btn-lime" disabled={submitting}>{submitting ? "Sending order…" : "Place order"} {!submitting && <Icon name="arrow" size={15} />}</button><p className="form-note">We will confirm availability with the selected branch. No online payment is taken in this demo checkout.</p></form>}</>}</aside></div>}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function MealCard({ item, onAdd, dark = false }: { item: MenuRow; onAdd: (item: MenuRow) => void; dark?: boolean }) {
  return <article className="meal-card" style={dark ? { background: "#2a322e", borderColor: "rgba(255,255,255,.08)", color: "white" } : undefined}><div className="meal-image"><img src={item.imageUrl ?? "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700"} alt={item.name} loading="lazy" /><span className="meal-label">{item.isFeatured ? "House favourite" : item.isPopular ? "Popular" : item.categoryName}</span></div><div className="meal-body"><h3>{item.name}</h3><p style={dark ? { color: "#aab5ad" } : undefined}>{item.description}</p><div className="meal-bottom"><span className="price" style={dark ? { color: "var(--lime)" } : undefined}>{item.options.length > 0 ? `From ${formatCurrency(item.price)}` : formatCurrency(item.price)}</span><button className="add-button" disabled={!item.isAvailable} onClick={() => onAdd(item)} aria-label={`Add ${item.name}`}>{item.isAvailable ? "+" : "–"}</button></div></div></article>;
}

function Gallery({ image, caption }: { image: string; caption: string }) {
  return <div className="gallery-item"><img src={image} alt={caption} loading="lazy" /><span className="gallery-caption">{caption}</span></div>;
}
