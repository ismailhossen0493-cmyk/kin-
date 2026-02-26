import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, Footer, FloatingSupport } from './components/Layout';
import { Shop } from './components/Shop';
import { CartDrawer } from './components/Cart';
import { AdminPanel } from './components/Admin';
import { AuthModal } from './components/AuthModal';
import { motion, AnimatePresence } from 'motion/react';

const Hero = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch('/api/hero-slides')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (data.length > 0) {
          setSlides(data);
        } else {
          setSlides([{
            title: "Heritage Meets Modernity",
            subtitle: "Discover our exclusive Panjabi and Saree collection, handcrafted for the modern Bangladeshi.",
            discount: "UP TO 50% OFF",
            offer_text: "EID COLLECTION 2025",
            image_url: "https://picsum.photos/seed/heritage/1920/1080"
          }]);
        }
      })
      .catch(err => {
        console.error(err);
        setSlides([{
          title: "Heritage Meets Modernity",
          subtitle: "Discover our exclusive Panjabi and Saree collection, handcrafted for the modern Bangladeshi.",
          discount: "UP TO 50% OFF",
          offer_text: "EID COLLECTION 2025",
          image_url: "https://picsum.photos/seed/heritage/1920/1080"
        }]);
      });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[700px] md:h-[900px] overflow-hidden bg-zinc-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img 
            src={slide.image_url} 
            className="w-full h-full object-cover opacity-50" 
            referrerPolicy="no-referrer"
            alt={slide.title}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
        <motion.div
          key={`content-${currentSlide}`}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl space-y-12"
        >
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="inline-flex items-center gap-3 px-6 py-2.5 glass rounded-full text-[10px] font-bold tracking-[0.3em] uppercase text-primary border border-primary/20"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              {slide.offer_text || "Limited Edition"}
            </motion.div>
            <h2 className="text-6xl md:text-[120px] font-serif font-bold tracking-tighter text-white leading-[0.85]">
              {slide.title.split(' ').map((word: string, i: number) => (
                <span key={i} className={i % 2 === 1 ? "text-primary italic" : ""}>{word} </span>
              ))}
            </h2>
            <p className="text-xl md:text-2xl text-zinc-400 font-medium max-w-xl leading-relaxed">
              {slide.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <div className="flex flex-col">
              <span className="text-accent text-lg font-serif italic">{slide.discount}</span>
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Exclusive Privilege</span>
            </div>
          </div>
        </motion.div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-16 left-4 md:left-auto md:right-16 flex md:flex-col gap-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-500 rounded-full ${idx === currentSlide ? 'h-12 w-1.5 bg-primary' : 'h-3 w-1.5 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isAdmin, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      const hasShown = sessionStorage.getItem('auth_prompt_shown');
      if (!hasShown) {
        setIsAuthOpen(true);
        sessionStorage.setItem('auth_prompt_shown', 'true');
      }
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Header 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenAdmin={() => isAdmin ? setIsAdminOpen(true) : setIsAuthOpen(true)}
        onOpenAuth={() => isAuthenticated ? logout() : setIsAuthOpen(true)}
      />
      
      <main>
        <Hero />
        <Shop />
      </main>

      <Footer />
      
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <FloatingSupport />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
