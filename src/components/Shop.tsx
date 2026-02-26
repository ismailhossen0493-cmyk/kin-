import React, { useState, useEffect } from 'react';
import { useCart, Product } from '../context/CartContext';
import { ShoppingCart, Filter, ChevronDown, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-[2rem] border border-black/5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-4 right-4">
          <span className="glass px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-primary border border-primary/10">
            {product.brand || "Kin! Original"}
          </span>
        </div>
      </div>
      <div className="p-8">
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className="w-3 h-3 fill-accent text-accent" />
          ))}
          <span className="text-[10px] text-zinc-400 ml-2 font-medium">4.9 / 5.0</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="text-xs text-zinc-500 mb-6 font-medium uppercase tracking-widest">{product.category}</p>
        <div className="flex items-center justify-between pt-4 border-t border-black/5">
          <span className="font-bold text-2xl text-primary">৳{product.price.toLocaleString()}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:bg-primary transition-all shadow-lg shadow-black/5 hover:shadow-primary/20 active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState(50000);

  const { addToCart } = useCart();

  useEffect(() => {
    if (selectedProduct) {
      setSelectedSize(selectedProduct.sizes?.[0] || '');
      setSelectedColor(selectedProduct.colors?.[0] || '');
    }
  }, [selectedProduct]);

  const fetchData = () => {
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ])
    .then(([pData, cData]) => {
      setProducts(pData.map((prod: any) => ({
        ...prod,
        sizes: prod.sizes ? JSON.parse(prod.sizes) : [],
        colors: prod.colors ? JSON.parse(prod.colors) : []
      })));
      setCategories(cData.filter((c: any) => !c.is_hidden));
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    
    // Listen for data refresh events from Admin panel
    const handleRefresh = () => fetchData();
    window.addEventListener('shop-refresh', handleRefresh);
    return () => window.removeEventListener('shop-refresh', handleRefresh);
  }, []);

  const visibleProducts = products.filter(p => {
    if (p.category_hidden) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category_id)) return false;
    if (p.price > priceRange) return false;
    return true;
  });

  const toggleCategory = (id: number) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/10 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="flex flex-col md:flex-row gap-16">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-72 flex-shrink-0">
          <div className="sticky top-32 space-y-12">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-8 flex items-center gap-3">
                <Filter className="w-4 h-4" /> Refine Selection
              </h4>
              <div className="space-y-10">
                <div>
                  <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-6 block">Categories</label>
                  <div className="space-y-4">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-3 text-sm text-zinc-600 cursor-pointer hover:text-primary transition-all group">
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                        />
                        <div className={`w-5 h-5 rounded-lg border-2 transition-colors flex items-center justify-center ${selectedCategories.includes(cat.id) ? 'border-primary bg-primary' : 'border-zinc-200 group-hover:border-primary'}`}>
                          <div className={`w-2 h-2 bg-white rounded-sm transition-opacity ${selectedCategories.includes(cat.id) ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        <span className={`font-medium ${selectedCategories.includes(cat.id) ? 'text-primary' : ''}`}>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-6 block">Price Range (Up to ৳{priceRange.toLocaleString()})</label>
                  <input 
                    type="range" 
                    className="w-full accent-primary h-1.5 bg-zinc-100 rounded-full appearance-none cursor-pointer" 
                    min="0" 
                    max="100000" 
                    step="500"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400 mt-4 tracking-widest">
                    <span>৳0</span>
                    <span>৳100,000+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block">Curated Collection</span>
              <h2 className="text-5xl font-serif font-bold tracking-tighter text-zinc-900">New Arrivals</h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Sort by</span>
              <button className="flex items-center gap-2 text-zinc-900 hover:text-primary transition-colors">
                Newest First <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-12">
            {visibleProducts.map(product => (
              <div key={product.id} onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                <ProductCard product={{...product, category: product.category_name}} />
              </div>
            ))}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-8 right-8 z-10 p-4 bg-white/10 hover:bg-white/20 text-white md:text-zinc-900 md:bg-zinc-100 md:hover:bg-zinc-200 rounded-full transition-all backdrop-blur-md"
              >
                <ChevronDown className="w-6 h-6 rotate-90 md:rotate-0" />
              </button>

              <div className="w-full md:w-1/2 h-[400px] md:h-auto relative">
                <img 
                  src={selectedProduct.image_url} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden" />
              </div>

              <div className="flex-1 p-8 md:p-16 overflow-y-auto">
                <div className="space-y-10">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block">{selectedProduct.category_name}</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter text-zinc-900 mb-4">{selectedProduct.name}</h2>
                    <div className="flex items-center gap-6">
                      <span className="text-3xl font-bold text-primary">৳{selectedProduct.price.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                        ))}
                        <span className="text-[10px] text-zinc-400 ml-2 font-bold uppercase tracking-widest">Highly Rated</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {selectedProduct.description && (
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">The Narrative</h4>
                        <p className="text-zinc-600 leading-relaxed font-medium">{selectedProduct.description}</p>
                      </div>
                    )}

                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Select Size</h4>
                        <div className="flex flex-wrap gap-3">
                          {selectedProduct.sizes.map(size => (
                            <button 
                              key={size} 
                              onClick={() => setSelectedSize(size)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedSize === size ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-zinc-50 border border-black/5 text-zinc-900 hover:border-zinc-300'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Select Color</h4>
                        <div className="flex flex-wrap gap-4">
                          {selectedProduct.colors.map(color => (
                            <button 
                              key={color} 
                              onClick={() => setSelectedColor(color)}
                              className={`w-10 h-10 rounded-full border-4 transition-all ${selectedColor === color ? 'border-primary scale-110 shadow-xl' : 'border-white shadow-lg ring-1 ring-black/5 hover:scale-105'}`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-10 border-t border-black/5 flex items-center gap-6">
                    <button 
                      onClick={() => {
                        addToCart(selectedProduct, selectedSize, selectedColor);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 py-6 bg-zinc-950 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Collection
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
