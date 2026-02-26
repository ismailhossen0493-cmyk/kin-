import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, User, Menu, X, Phone, MessageCircle, LogOut, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const Header = ({ onOpenCart, onOpenAdmin, onOpenAuth }: { onOpenCart: () => void, onOpenAdmin: () => void, onOpenAuth: () => void }) => {
  const { cart } = useCart();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-4' : 'py-8'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className={`glass rounded-[2rem] border border-white/10 px-8 py-4 flex items-center justify-between transition-all duration-500 ${isScrolled ? 'shadow-2xl shadow-black/10' : ''}`}>
          <div className="flex items-center gap-12">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center font-serif font-bold text-xl text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">K</div>
              <span className="text-2xl font-serif font-bold tracking-tighter text-zinc-900">Kin!</span>
            </a>
            
            <nav className="hidden md:flex items-center gap-8">
              {['Shop', 'Collections', 'Heritage', 'Journal'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-primary transition-colors">
                  {item}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-full border border-black/5">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input type="text" placeholder="Search elegance..." className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-32 focus:w-48 transition-all" />
            </div>

            <div className="flex items-center gap-4">
              {isAdmin && (
                <button onClick={onOpenAdmin} className="p-3 hover:bg-primary/5 text-primary rounded-2xl transition-all flex items-center gap-2 group">
                  <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-[0.2em]">Dashboard</span>
                </button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-4 pl-4 border-l border-black/5">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Patron</span>
                    <span className="text-xs font-bold text-zinc-900">{user?.name}</span>
                  </div>
                  <button onClick={logout} className="p-2.5 hover:bg-red-50 text-red-500 rounded-full transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button onClick={onOpenAuth} className="p-3 hover:bg-zinc-100 rounded-2xl transition-all flex items-center gap-2 group">
                  <User className="w-5 h-5 text-zinc-700 group-hover:text-primary transition-colors" />
                  <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-[0.2em]">Sign In / Admin</span>
                </button>
              )}
              
              <button onClick={onOpenCart} className="relative p-3 bg-zinc-900 text-white rounded-2xl hover:bg-primary transition-all shadow-lg shadow-black/10 group">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Footer = () => {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-zinc-950 text-white pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-serif font-bold text-2xl">K</div>
              <span className="text-3xl font-serif font-bold tracking-tighter">Kin!</span>
            </div>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              {settings.footer_about || 'Crafting premium lifestyle experiences that celebrate the rich heritage of Bangladesh with a modern, global perspective.'}
            </p>
            <div className="flex gap-4">
              {['Instagram', 'Facebook', 'Twitter'].map(social => (
                <a key={social} href="#" className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-zinc-400 group-hover:bg-white transition-colors" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-8">Collections</h4>
            <ul className="space-y-4">
              {['Men\'s Heritage', 'Women\'s Couture', 'Artisanal Accessories', 'Limited Edition'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-zinc-400 hover:text-primary transition-colors font-medium">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-8">Concierge</h4>
            <ul className="space-y-4">
              <li className="text-sm text-zinc-400 font-medium flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary" /> {settings.contact_phone || '+880 1234-567890'}
              </li>
              <li className="text-sm text-zinc-400 font-medium flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-primary" /> {settings.contact_email || 'concierge@kin.com.bd'}
              </li>
              {['Shipping Policy', 'Returns & Exchanges', 'Size Guide'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-zinc-400 hover:text-primary transition-colors font-medium">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            © 2025 Kin! Bangladesh. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const FloatingSupport = () => (
  <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
    <motion.button 
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
    >
      <MessageCircle className="w-6 h-6" />
    </motion.button>
  </div>
);
