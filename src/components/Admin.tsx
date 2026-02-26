import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Settings, TrendingUp, Users, Clock, X, Filter, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminPanel = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, productCount: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<any>(null);
  const [isEditingCategory, setIsEditingCategory] = useState<any>(null);
  const [isEditingSlide, setIsEditingSlide] = useState<any>(null);

  const fetchData = async () => {
    const [s, o, p, c, u, hs, st] = await Promise.all([
      fetch('/api/admin/stats').then(res => res.json()),
      fetch('/api/admin/orders').then(res => res.json()),
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/admin/users').then(res => res.json()),
      fetch('/api/hero-slides').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]);
    setStats(s);
    setOrders(o);
    setProducts(p.map((prod: any) => ({
      ...prod,
      sizes: prod.sizes ? JSON.parse(prod.sizes) : [],
      colors: prod.colors ? JSON.parse(prod.colors) : []
    })));
    setCategories(c);
    setUsers(u);
    setHeroSlides(hs);
    setSettings(st);
  };

  useEffect(() => { if (isOpen) fetchData(); }, [isOpen]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditingProduct.id ? 'PUT' : 'POST';
    const url = isEditingProduct.id ? `/api/products/${isEditingProduct.id}` : '/api/products';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEditingProduct)
    });
    setIsEditingProduct(null);
    fetchData();
    window.dispatchEvent(new CustomEvent('shop-refresh'));
  };

  const handleCategorySubmit = async (e: React.FormEvent, categoryOverride?: any) => {
    if (e) e.preventDefault();
    const categoryToSave = categoryOverride || isEditingCategory;
    const method = categoryToSave.id ? 'PUT' : 'POST';
    const url = categoryToSave.id ? `/api/categories/${categoryToSave.id}` : '/api/categories';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryToSave)
    });
    if (response.ok) {
      setIsEditingCategory(null);
      fetchData();
      window.dispatchEvent(new CustomEvent('shop-refresh'));
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    alert('Settings updated successfully!');
    fetchData();
  };

  const handleSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditingSlide.id ? 'PUT' : 'POST';
    const url = isEditingSlide.id ? `/api/hero-slides/${isEditingSlide.id}` : '/api/hero-slides';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEditingSlide)
    });
    if (response.ok) {
      setIsEditingSlide(null);
      fetchData();
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    fetchData();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'slide') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'product') setIsEditingProduct({ ...isEditingProduct, image_url: reader.result as string });
        else setIsEditingSlide({ ...isEditingSlide, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSize = (size: string) => {
    const currentSizes = isEditingProduct.sizes || [];
    if (currentSizes.includes(size)) setIsEditingProduct({ ...isEditingProduct, sizes: currentSizes.filter((s: string) => s !== size) });
    else setIsEditingProduct({ ...isEditingProduct, sizes: [...currentSizes, size] });
  };

  const addColor = (color: string) => {
    const currentColors = isEditingProduct.colors || [];
    if (!currentColors.includes(color)) setIsEditingProduct({ ...isEditingProduct, colors: [...currentColors, color] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-paper z-[100] flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-80 bg-zinc-950 text-white p-8 flex flex-col border-r border-white/5">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-serif font-bold text-2xl shadow-lg shadow-primary/20">K</div>
            <div>
              <h2 className="text-xl font-serif font-bold tracking-tighter">Kin! Admin</h2>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Management Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'inventory', icon: Package, label: 'Inventory' },
            { id: 'categories', icon: Filter, label: 'Categories' },
            { id: 'hero', icon: TrendingUp, label: 'Hero Slider' },
            { id: 'orders', icon: ShoppingCart, label: 'Orders' },
            { id: 'users', icon: Users, label: 'Roles & Access' },
            { id: 'settings', icon: Settings, label: 'Store Settings' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 bg-paper">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-end mb-16">
            <h1 className="text-5xl font-serif font-bold tracking-tighter text-zinc-900 capitalize">{activeTab}</h1>
            <div className="flex gap-4">
              {activeTab === 'inventory' && <button onClick={() => setIsEditingProduct({ name: '', price: 0, category_id: categories[0]?.id, brand: '', stock: 0, image_url: '', description: '', sizes: [], colors: [], is_preorder: 0 })} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3"><Plus className="w-4 h-4" /> New Product</button>}
              {activeTab === 'categories' && <button onClick={() => setIsEditingCategory({ name: '' })} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3"><Plus className="w-4 h-4" /> New Category</button>}
              {activeTab === 'hero' && <button onClick={() => setIsEditingSlide({ title: '', subtitle: '', discount: '', offer_text: '', image_url: '', link: '' })} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3"><Plus className="w-4 h-4" /> New Slide</button>}
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bento-card">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Revenue</p>
                <h3 className="text-4xl font-serif font-bold">৳{stats.totalSales.toLocaleString()}</h3>
              </div>
              <div className="bento-card">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Orders</p>
                <h3 className="text-4xl font-serif font-bold">{stats.orderCount}</h3>
              </div>
              <div className="bento-card">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Products</p>
                <h3 className="text-4xl font-serif font-bold">{stats.productCount}</h3>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-400 uppercase text-[9px] font-bold tracking-[0.2em]">
                  <tr><th className="px-10 py-6">Order ID</th><th className="px-10 py-6">Customer</th><th className="px-10 py-6">Items</th><th className="px-10 py-6">Status</th><th className="px-10 py-6">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="px-10 py-8 font-mono text-[10px]">#ORD-{order.id}</td>
                      <td className="px-10 py-8"><div className="font-bold">{order.customer_name}</div><div className="text-[10px] text-zinc-500">{order.customer_phone}</div></td>
                      <td className="px-10 py-8">
                        <div className="space-y-2">
                          {JSON.parse(order.items).map((item: any, idx: number) => (
                            <div key={idx} className="text-[10px] bg-zinc-50 p-2 rounded-lg border border-black/5">
                              <span className="font-bold">{item.name}</span> (x{item.quantity}) {item.size && `| Size: ${item.size}`}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <select value={order.status} onChange={(e) => fetch(`/api/admin/orders/${order.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: e.target.value }) }).then(() => fetchData())} className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700">
                          <option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-10 py-8 font-bold">৳{order.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products.map(product => (
                <div key={product.id} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex gap-6 group hover:shadow-xl transition-all">
                  <img src={product.image_url} className="w-24 h-24 object-cover rounded-2xl" />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div><h4 className="font-serif font-bold truncate">{product.name}</h4><p className="text-[10px] text-zinc-400 uppercase">{product.category_name}</p></div>
                    <div className="flex justify-between items-center"><span className="font-bold text-primary">৳{product.price}</span><button onClick={() => setIsEditingProduct(product)} className="p-2 bg-zinc-100 rounded-xl hover:bg-primary hover:text-white transition-all"><Settings className="w-4 h-4" /></button></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-black/5">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-8 py-6 font-bold">{user.name}</td>
                      <td className="px-8 py-6 text-zinc-500">{user.email}</td>
                      <td className="px-8 py-6">
                        <select value={user.role || ''} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="bg-zinc-100 border-none rounded-xl text-xs font-bold px-3 py-2">
                          <option value="user">User</option><option value="editor">Editor</option><option value="parcel_moderator">Parcel Moderator</option><option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm p-12">
              <form onSubmit={handleSettingsSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h3 className="text-2xl font-serif font-bold border-b pb-4">Footer Content</h3>
                    <textarea className="w-full p-5 bg-zinc-50 border rounded-2xl h-32" value={settings.footer_about || ''} onChange={e => setSettings({ ...settings, footer_about: e.target.value })} placeholder="About Store" />
                    <textarea className="w-full p-5 bg-zinc-50 border rounded-2xl h-32" value={settings.privacy_policy || ''} onChange={e => setSettings({ ...settings, privacy_policy: e.target.value })} placeholder="Privacy Policy" />
                  </div>
                  <div className="space-y-8">
                    <h3 className="text-2xl font-serif font-bold border-b pb-4">Contact Info</h3>
                    <input className="w-full p-5 bg-zinc-50 border rounded-2xl" value={settings.contact_phone || ''} onChange={e => setSettings({ ...settings, contact_phone: e.target.value })} placeholder="Phone" />
                    <input className="w-full p-5 bg-zinc-50 border rounded-2xl" value={settings.contact_email || ''} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} placeholder="Email" />
                    <input className="w-full p-5 bg-zinc-50 border rounded-2xl" value={settings.whatsapp_number || ''} onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="WhatsApp" />
                  </div>
                </div>
                <button type="submit" className="w-full py-6 bg-zinc-950 text-white rounded-[1.5rem] font-bold uppercase tracking-widest">Save Settings</button>
              </form>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isEditingProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingProduct(null)} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleProductSubmit} className="p-12 space-y-12">
                <div className="flex justify-between items-center">
                  <h3 className="text-4xl font-serif font-bold">Product Management</h3>
                  <button type="button" onClick={() => setIsEditingProduct(null)} className="p-4 hover:bg-zinc-100 rounded-2xl"><X className="w-6 h-6" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-10">
                    <input required className="w-full p-5 bg-zinc-50 border rounded-2xl" value={isEditingProduct.name} onChange={e => setIsEditingProduct({...isEditingProduct, name: e.target.value})} placeholder="Product Name" />
                    <div className="grid grid-cols-2 gap-6">
                      <input type="number" required className="w-full p-5 bg-zinc-50 border rounded-2xl" value={isEditingProduct.price} onChange={e => setIsEditingProduct({...isEditingProduct, price: parseFloat(e.target.value)})} placeholder="Price" />
                      <input type="number" required className="w-full p-5 bg-zinc-50 border rounded-2xl" value={isEditingProduct.stock} onChange={e => setIsEditingProduct({...isEditingProduct, stock: parseInt(e.target.value)})} placeholder="Stock" />
                    </div>
                    <div className="flex items-center gap-4 p-5 bg-zinc-50 border rounded-2xl">
                      <input type="checkbox" id="preorder" checked={isEditingProduct.is_preorder === 1} onChange={e => setIsEditingProduct({...isEditingProduct, is_preorder: e.target.checked ? 1 : 0})} />
                      <label htmlFor="preorder" className="text-xs font-bold uppercase tracking-widest">Enable Pre-order Mode</label>
                    </div>
                    <select className="w-full p-5 bg-zinc-50 border rounded-2xl" value={isEditingProduct.category_id ?? ''} onChange={e => setIsEditingProduct({...isEditingProduct, category_id: parseInt(e.target.value)})}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <textarea className="w-full p-5 bg-zinc-50 border rounded-2xl h-40" value={isEditingProduct.description} onChange={e => setIsEditingProduct({...isEditingProduct, description: e.target.value})} placeholder="Description" />
                  </div>
                  <div className="space-y-10">
                    <div className="flex flex-wrap gap-3">
                      {['S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'].map(size => (
                        <button key={size} type="button" onClick={() => toggleSize(size)} className={`w-14 h-14 rounded-2xl text-xs font-bold border ${isEditingProduct.sizes?.includes(size) ? 'bg-primary text-white border-primary' : 'bg-zinc-50 text-zinc-400'}`}>{size}</button>
                      ))}
                    </div>
                    <div className="aspect-video bg-zinc-50 border-2 border-dashed rounded-[2rem] overflow-hidden relative">
                      {isEditingProduct.image_url && <img src={isEditingProduct.image_url} className="w-full h-full object-cover" />}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <input className="w-full p-5 bg-zinc-50 border rounded-2xl text-xs" value={isEditingProduct.image_url} onChange={e => setIsEditingProduct({...isEditingProduct, image_url: e.target.value})} placeholder="Or paste Image URL" />
                  </div>
                </div>
                <button type="submit" className="w-full py-6 bg-zinc-950 text-white rounded-[1.5rem] font-bold uppercase tracking-widest">Save Masterpiece</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
