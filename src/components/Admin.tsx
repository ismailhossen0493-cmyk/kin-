import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Settings, TrendingUp, Users, Clock, X, Filter, Plus } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

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

  const handleRoleChange = async (userId: number, role: string) => {
    await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    fetchData();
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
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-zinc-600'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 bg-paper">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-serif font-bold tracking-tighter text-zinc-900 capitalize mb-16">{activeTab}</h1>

          {activeTab === 'orders' && (
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50/50 text-zinc-400 uppercase text-[9px] font-bold tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">Order ID</th>
                    <th className="px-10 py-6">Customer</th>
                    <th className="px-10 py-6">Items</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="px-10 py-8 font-mono text-[10px] font-bold text-zinc-400">#ORD-{order.id}</td>
                      <td className="px-10 py-8">
                        <div className="font-bold text-zinc-900">{order.customer_name}</div>
                        <div className="text-[10px] text-zinc-500 font-medium">{order.customer_phone}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-2">
                          {JSON.parse(order.items).map((item: any, idx: number) => (
                            <div key={idx} className="text-[10px] font-medium text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-black/5">
                              <span className="font-bold text-zinc-900">{item.name}</span>
                              <div className="flex gap-2 text-zinc-400">
                                <span>Qty: {item.quantity}</span>
                                {item.size && <span>• Size: {item.size}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <select value={order.status} onChange={(e) => fetch(`/api/admin/orders/${order.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: e.target.value }) }).then(() => fetchData())} className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700">
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-10 py-8 font-bold text-zinc-900">৳{order.total_amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-black/5">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-8 py-6 font-bold">{user.name}</td>
                      <td className="px-8 py-6">
                        <select value={user.role || ''} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="bg-zinc-100 border-none rounded-xl text-xs font-bold px-3 py-2">
                          <option value="user">User</option>
                          <option value="editor">Editor</option>
                          <option value="parcel_moderator">Parcel Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isEditingProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingProduct(null)} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleProductSubmit} className="p-12 space-y-12">
                <h3 className="text-4xl font-serif font-bold">Product Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-10">
                    <input required className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl" value={isEditingProduct.name} onChange={e => setIsEditingProduct({...isEditingProduct, name: e.target.value})} placeholder="Product Name" />
                    <div className="flex items-center gap-4 p-5 bg-zinc-50 border border-black/5 rounded-2xl">
                      <input type="checkbox" id="preorder" checked={isEditingProduct.is_preorder === 1} onChange={e => setIsEditingProduct({...isEditingProduct, is_preorder: e.target.checked ? 1 : 0})} />
                      <label htmlFor="preorder" className="text-xs font-bold uppercase tracking-widest">Enable Pre-order Mode</label>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-6 bg-zinc-950 text-white rounded-[1.5rem] font-bold uppercase tracking-[0.3em]">Save Product</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
