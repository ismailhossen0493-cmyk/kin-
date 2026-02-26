import React, { useState, useEffect } from 'react';
import { useCart, Product } from '../context/CartContext';
import { ShoppingCart, Filter, ChevronDown, Star, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group relative bg-white rounded-[2rem] border border-black/5 overflow-hidden transition-all duration-500 hover:shadow-2xl">
      <div className="aspect-[3/4] overflow-hidden relative">
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <span className="glass px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-primary border border-primary/10">{product.brand || "Kin! Original"}</span>
          {product.is_preorder === 1 && <span className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em]">Pre-order</span>}
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-xl font-serif font-bold text-zinc-900 mb-2">{product.name}</h3>
        <div className="flex items-center justify-between pt-4 border-t border-black/5">
          <span className="font-bold text-2xl text-primary">৳{product.price.toLocaleString()}</span>
          <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${product.is_preorder === 1 ? 'bg-amber-500 text-white' : 'bg-zinc-900 text-white'}`}>
            {product.is_preorder === 1 ? <Clock className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(data => {
      setProducts(data.map((prod: any) => ({ ...prod, sizes: prod.sizes ? JSON.parse(prod.sizes) : [], colors: prod.colors ? JSON.parse(prod.colors) : [] })));
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        {products.map(product => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
};
