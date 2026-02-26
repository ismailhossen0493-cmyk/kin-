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

  const deleteCategory = async (id: number) => {
    if (confirm('Are you sure you want to delete this category? All products in this category will be unlinked.')) {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
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

  const pickColorFromImage = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    const rect = img.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);
    
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    
    if (!isEditingProduct.colors.includes(hex)) {
      setIsEditingProduct({
        ...isEditingProduct,
        colors: [...isEditingProduct.colors, hex]
      });
    }
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
        if (type === 'product') {
          setIsEditingProduct({ ...isEditingProduct, image_url: reader.result as string });
        } else {
          setIsEditingSlide({ ...isEditingSlide, image_url: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSize = (size: string) => {
    const currentSizes = isEditingProduct.sizes || [];
    if (currentSizes.includes(size)) {
      setIsEditingProduct({ ...isEditingProduct, sizes: currentSizes.filter((s: string) => s !== size) });
    } else {
      setIsEditingProduct({ ...isEditingProduct, sizes: [...currentSizes, size] });
    }
  };

  const addColor = (color: string) => {
    const currentColors = isEditingProduct.colors || [];
    if (!currentColors.includes(color)) {
      setIsEditingProduct({ ...isEditingProduct, colors: [...currentColors, color] });
    }
  };

  const removeColor = (color: string) => {
    setIsEditingProduct({ ...isEditingProduct, colors: (isEditingProduct.colors || []).filter((c: string) => c !== color) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-paper z-[100] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar - Mobile Responsive */}
      <aside className="w-full md:w-80 bg-zinc-950 text-white p-8 flex flex-col border-r border-white/5">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-serif font-bold text-2xl shadow-lg shadow-primary/20">K</div>
            <div>
              <h2 className="text-xl font-serif font-bold tracking-tighter">Kin! Admin</h2>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Management Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-2 hover:bg-white/10 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'inventory', icon: Package, label: 'Inventory' },
            { id: 'categories', icon: Filter, label: 'Categories' },
            { id: 'hero', icon: TrendingUp, label: 'Hero Slider' },
            { id: 'orders', icon: ShoppingCart, label: 'Orders' },
            { id: 'users', icon: Users, label: 'User Roles' },
            { id: 'settings', icon: Settings, label: 'Store Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-zinc-600'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5">
          <button onClick={onClose} className="w-full px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
            Exit Dashboard
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 bg-paper">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block">Store Operations</span>
              <h1 className="text-5xl font-serif font-bold tracking-tighter text-zinc-900 capitalize">{activeTab}</h1>
            </div>
            <div className="flex gap-4">
              {activeTab === 'inventory' && (
                <button 
                  onClick={() => setIsEditingProduct({ name: '', price: 0, category_id: categories[0]?.id, brand: '', stock: 0, image_url: '', description: '', sizes: [], colors: [] })}
                  className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-2xl shadow-black/10 flex items-center gap-3"
                >
                  <Plus className="w-4 h-4" /> New Product
                </button>
              )}
              {activeTab === 'categories' && (
                <button 
                  onClick={() => setIsEditingCategory({ name: '' })}
                  className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-2xl shadow-black/10 flex items-center gap-3"
                >
                  <Plus className="w-4 h-4" /> New Category
                </button>
              )}
              {activeTab === 'hero' && (
                <button 
                  onClick={() => setIsEditingSlide({ title: '', subtitle: '', discount: '', offer_text: '', image_url: '', link: '' })}
                  className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-2xl shadow-black/10 flex items-center gap-3"
                >
                  <Plus className="w-4 h-4" /> New Slide
                </button>
              )}
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <motion.div whileHover={{ y: -5 }} className="bento-card">
                  <div className="p-4 bg-primary/5 text-primary rounded-2xl w-fit mb-8"><TrendingUp className="w-6 h-6" /></div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Total Revenue</div>
                  <div className="text-4xl font-serif font-bold tracking-tighter text-zinc-900">৳{stats.totalSales.toLocaleString()}</div>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bento-card">
                  <div className="p-4 bg-accent/5 text-accent rounded-2xl w-fit mb-8"><ShoppingCart className="w-6 h-6" /></div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Total Orders</div>
                  <div className="text-4xl font-serif font-bold tracking-tighter text-zinc-900">{stats.orderCount}</div>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bento-card">
                  <div className="p-4 bg-zinc-100 text-zinc-900 rounded-2xl w-fit mb-8"><Package className="w-6 h-6" /></div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Products</div>
                  <div className="text-4xl font-serif font-bold tracking-tighter text-zinc-900">{stats.productCount}</div>
                </motion.div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-black/5 flex items-center justify-between">
                  <h3 className="font-serif font-bold text-2xl">Recent Transactions</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View Ledger</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 text-zinc-400 uppercase text-[9px] font-bold tracking-[0.2em]">
                      <tr>
                        <th className="px-10 py-6">Order ID</th>
                        <th className="px-10 py-6">Customer</th>
                        <th className="px-10 py-6">Status</th>
                        <th className="px-10 py-6">Amount</th>
                        <th className="px-10 py-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-10 py-8 font-mono text-[10px] font-bold text-zinc-400">#ORD-{order.id}</td>
                          <td className="px-10 py-8">
                            <div className="font-bold text-zinc-900">{order.customer_name}</div>
                            <div className="text-[10px] text-zinc-500 font-medium">{order.customer_phone}</div>
                          </td>
                          <td className="px-10 py-8">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-10 py-8 font-bold text-zinc-900">৳{order.total_amount.toLocaleString()}</td>
                          <td className="px-10 py-8 text-zinc-400 text-xs font-medium">{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-black/5 flex items-center justify-between">
                <h3 className="font-serif font-bold text-2xl">Order Management</h3>
                <div className="flex gap-4">
                  <button className="px-6 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">Export CSV</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50/50 text-zinc-400 uppercase text-[9px] font-bold tracking-[0.2em]">
                    <tr>
                      <th className="px-10 py-6">Order ID</th>
                      <th className="px-10 py-6">Customer</th>
                      <th className="px-10 py-6">Items</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6">Amount</th>
                      <th className="px-10 py-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-10 py-8 font-mono text-[10px] font-bold text-zinc-400">#ORD-{order.id}</td>
                        <td className="px-10 py-8">
                          <div className="font-bold text-zinc-900">{order.customer_name}</div>
                          <div className="text-[10px] text-zinc-500 font-medium">{order.customer_phone}</div>
                          <div className="text-[10px] text-zinc-400 font-medium truncate max-w-[200px]">{order.address}</div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="text-xs font-medium text-zinc-600">
                            {JSON.parse(order.items).length} Items
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <select 
                            value={order.status}
                            onChange={(e) => {
                              fetch(`/api/admin/orders/${order.id}/status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: e.target.value })
                              }).then(() => fetchData());
                            }}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border-none outline-none cursor-pointer ${
                              order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-10 py-8 font-bold text-zinc-900">৳{order.total_amount.toLocaleString()}</td>
                        <td className="px-10 py-8 text-zinc-400 text-xs font-medium">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(product => (
                <div key={product.id} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm flex gap-6 group hover:shadow-xl transition-all duration-500">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-lg text-zinc-900 truncate">{product.name}</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{product.category_name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">৳{product.price.toLocaleString()}</span>
                      <button 
                        onClick={() => setIsEditingProduct(product)}
                        className="p-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-black/5"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm flex flex-col gap-6 hover:shadow-xl transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xl">{cat.name}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingCategory(cat)} 
                        className="p-3 bg-zinc-100 text-zinc-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteCategory(cat.id)} 
                        className="p-3 bg-zinc-100 text-zinc-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-black/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Visibility</span>
                    <button 
                      onClick={() => handleCategorySubmit(null as any, { ...cat, is_hidden: !cat.is_hidden })}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${!cat.is_hidden ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-400'}`}
                    >
                      {!cat.is_hidden ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {heroSlides.map(slide => (
                <div key={slide.id} className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all duration-500">
                  <div className="w-full h-56 rounded-[1.5rem] overflow-hidden">
                    <img src={slide.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-2xl text-zinc-900 truncate">{slide.title}</h4>
                    <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{slide.subtitle}</p>
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-black/5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{slide.discount}</span>
                      <button 
                        onClick={() => setIsEditingSlide(slide)}
                        className="p-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-black/5"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50/50 text-zinc-400 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-8 py-5">User</th>
                    <th className="px-8 py-5">Email</th>
                    <th className="px-8 py-5">Role</th>
                    <th className="px-8 py-5">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-8 py-6 font-bold">{user.name}</td>
                      <td className="px-8 py-6 text-zinc-500">{user.email}</td>
                      <td className="px-8 py-6">
                        <select 
                          value={user.role || ''}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-zinc-100 border-none rounded-xl text-xs font-bold px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-8 py-6 text-zinc-400">{new Date(user.created_at).toLocaleDateString()}</td>
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
                    <h3 className="text-2xl font-serif font-bold border-b border-black/5 pb-4">Footer Content</h3>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Store History / About</label>
                      <textarea 
                        className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all h-32 font-medium"
                        value={settings.footer_about || ''}
                        onChange={e => setSettings({ ...settings, footer_about: e.target.value })}
                        placeholder="Crafting elegance for the modern lifestyle..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Privacy Policy</label>
                      <textarea 
                        className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all h-32 font-medium"
                        value={settings.privacy_policy || ''}
                        onChange={e => setSettings({ ...settings, privacy_policy: e.target.value })}
                        placeholder="Our privacy policy details..."
                      />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <h3 className="text-2xl font-serif font-bold border-b border-black/5 pb-4">Contact Information</h3>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Support Phone</label>
                      <input 
                        className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                        value={settings.contact_phone || ''}
                        onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                        placeholder="+880 1234-567890"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Support Email</label>
                      <input 
                        className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                        value={settings.contact_email || ''}
                        onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                        placeholder="concierge@kin.com.bd"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">WhatsApp Order Number</label>
                      <input 
                        className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                        value={settings.whatsapp_number || ''}
                        onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })}
                        placeholder="8801831990776"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Store Address</label>
                      <input 
                        className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                        value={settings.store_address || ''}
                        onChange={e => setSettings({ ...settings, store_address: e.target.value })}
                        placeholder="Dhaka, Bangladesh"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-6 bg-zinc-950 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-2xl shadow-primary/20">
                  Save Store Settings
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Product Edit Modal */}
      <AnimatePresence>
        {isEditingProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingProduct(null)} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleProductSubmit} className="p-12 space-y-12">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-2 block">Inventory Management</span>
                    <h3 className="text-4xl font-serif font-bold">{isEditingProduct.id ? 'Refine Product' : 'New Creation'}</h3>
                  </div>
                  <button type="button" onClick={() => setIsEditingProduct(null)} className="p-4 hover:bg-zinc-100 rounded-2xl transition-colors"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-10">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Product Designation</label>
                      <input required className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" value={isEditingProduct.name} onChange={e => setIsEditingProduct({...isEditingProduct, name: e.target.value})} placeholder="e.g. Royal Silk Panjabi" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Valuation (৳)</label>
                        <input type="number" required className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-primary" value={isEditingProduct.price} onChange={e => setIsEditingProduct({...isEditingProduct, price: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Stock Count</label>
                        <input type="number" required className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" value={isEditingProduct.stock} onChange={e => setIsEditingProduct({...isEditingProduct, stock: parseInt(e.target.value)})} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Collection Category</label>
                      <select className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none" value={isEditingProduct.category_id ?? ''} onChange={e => setIsEditingProduct({...isEditingProduct, category_id: parseInt(e.target.value)})}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Product Narrative</label>
                      <textarea className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all h-40 font-medium leading-relaxed" value={isEditingProduct.description} onChange={e => setIsEditingProduct({...isEditingProduct, description: e.target.value})} placeholder="Describe the craftsmanship..." />
                    </div>
                  </div>
                  <div className="space-y-10">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6 block">Available Dimensions</label>
                      <div className="flex flex-wrap gap-3">
                        {['S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'].map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`w-14 h-14 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center ${isEditingProduct.sizes?.includes(size) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-zinc-50 text-zinc-400 border-black/5 hover:border-primary/30'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6 block">Palette Selection</label>
                      <div className="flex flex-wrap gap-4 items-center">
                        {isEditingProduct.colors?.map((color: string) => (
                          <div key={color} className="relative group">
                            <div className="w-12 h-12 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: color }} />
                            <button 
                              type="button"
                              onClick={() => removeColor(color)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div className="relative w-12 h-12 rounded-full border-2 border-dashed border-zinc-200 flex items-center justify-center hover:border-primary transition-colors cursor-pointer overflow-hidden">
                          <Plus className="w-5 h-5 text-zinc-400" />
                          <input 
                            type="color" 
                            className="absolute inset-0 opacity-0 cursor-pointer scale-150" 
                            onChange={(e) => addColor(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6 block">Visual Asset (Click image to extract colors)</label>
                      <div className="aspect-video bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2rem] overflow-hidden relative group cursor-crosshair hover:border-primary transition-all duration-500 shadow-inner">
                        {isEditingProduct.image_url ? (
                          <>
                            <img 
                              src={isEditingProduct.image_url} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onClick={pickColorFromImage}
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                                <Plus className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Pick Color From Pixel</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                            <Package className="w-10 h-10 mb-3 opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Upload Masterpiece</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <div className="mt-6 flex gap-4">
                        <input className="flex-1 p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs font-medium" value={isEditingProduct.image_url} onChange={e => setIsEditingProduct({...isEditingProduct, image_url: e.target.value})} placeholder="Or paste image URL..." />
                      </div>
                    </div>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-6 pt-8 border-t border-black/5">
                  <button type="button" onClick={() => setIsEditingProduct(null)} className="px-12 py-6 bg-zinc-100 text-zinc-600 rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all">
                    Discard
                  </button>
                  <button type="submit" className="flex-1 py-6 bg-zinc-950 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-2xl shadow-primary/20">
                    {isEditingProduct.id ? 'Update Masterpiece' : 'Publish Creation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Slide Edit Modal */}
      <AnimatePresence>
        {isEditingSlide && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingSlide(null)} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-white z-10">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-1 block">Cinematic Experience</span>
                  <h3 className="text-3xl font-serif font-bold">{isEditingSlide.id ? 'Refine Slide' : 'New Vision'}</h3>
                </div>
                <button type="button" onClick={() => setIsEditingSlide(null)} className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSlideSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Headline</label>
                      <input required className="w-full p-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-serif font-bold text-lg" value={isEditingSlide.title} onChange={e => setIsEditingSlide({...isEditingSlide, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Sub-narrative</label>
                      <input className="w-full p-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" value={isEditingSlide.subtitle} onChange={e => setIsEditingSlide({...isEditingSlide, subtitle: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Discount</label>
                        <input className="w-full p-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-accent text-sm" value={isEditingSlide.discount} onChange={e => setIsEditingSlide({...isEditingSlide, discount: e.target.value})} placeholder="50% OFF" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Offer Tag</label>
                        <input className="w-full p-4 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-primary text-sm" value={isEditingSlide.offer_text} onChange={e => setIsEditingSlide({...isEditingSlide, offer_text: e.target.value})} placeholder="EID 2026" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Cinematic Asset</label>
                      <div className="aspect-video md:aspect-[4/5] bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2rem] overflow-hidden relative group cursor-pointer hover:border-primary transition-all shadow-inner">
                        {isEditingSlide.image_url ? (
                          <img src={isEditingSlide.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                            <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Upload Visual</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'slide')} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      </div>
                      <div className="mt-4">
                        <input className="w-full p-4 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[10px] font-medium" value={isEditingSlide.image_url} onChange={e => setIsEditingSlide({...isEditingSlide, image_url: e.target.value})} placeholder="Or paste image URL..." />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsEditingSlide(null)} className="px-8 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">
                    Discard
                  </button>
                  <button type="submit" className="flex-1 py-4 bg-zinc-950 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-primary/10">
                    {isEditingSlide.id ? 'Update Slide' : 'Publish Slide'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Edit Modal */}
      <AnimatePresence>
        {isEditingCategory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingCategory(null)} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
              <form onSubmit={handleCategorySubmit} className="p-10 space-y-8">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-2 block">Taxonomy</span>
                  <h3 className="text-3xl font-serif font-bold">{isEditingCategory.id ? 'Refine Category' : 'New Category'}</h3>
                </div>
                <input required className="w-full p-5 bg-zinc-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg" value={isEditingCategory.name} onChange={e => setIsEditingCategory({...isEditingCategory, name: e.target.value})} placeholder="Category Name" />
                <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border border-black/5">
                  <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Hide from customers</span>
                  <button 
                    type="button"
                    onClick={() => setIsEditingCategory({ ...isEditingCategory, is_hidden: !isEditingCategory.is_hidden })}
                    className={`w-12 h-6 rounded-full transition-all relative ${isEditingCategory.is_hidden ? 'bg-primary' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isEditingCategory.is_hidden ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <button type="submit" className="w-full py-5 bg-zinc-950 text-white rounded-[1.25rem] font-bold text-xs uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-2xl shadow-primary/20">
                  Save Category
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
