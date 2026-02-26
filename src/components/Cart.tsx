import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { X, Trash2, Plus, Minus, CreditCard, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    payment: 'COD',
    area: 'Inside Dhaka'
  });

  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
      }));
    }
  }, [user]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const shipping = formData.area === 'Inside Dhaka' ? 60 : 120;
    const finalTotal = total + shipping;

    const orderData = {
      user_id: user?.id,
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      address: `${formData.address} (${formData.area})`,
      total_amount: finalTotal,
      items: cart,
      payment_method: formData.payment
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      const data = await res.json();
      if (formData.payment === 'WhatsApp') {
        const itemsText = cart.map(item => `• ${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''} (x${item.quantity}) - ৳${item.price}`).join('\n');
        const message = `*ORDER #${data.id}: Kin!*\n\n*Name:* ${formData.name}\n*Phone:* ${formData.phone}\n*Address:* ${formData.address}, ${formData.area}\n\n*Items:*\n${itemsText}\n\n*Subtotal:* ৳${total}\n*Shipping:* ৳${shipping} (${formData.area})\n*Total:* ৳${finalTotal}`;
        
        const whatsappPhone = settings.whatsapp_number?.replace(/[^0-9]/g, '') || settings.contact_phone?.replace(/[^0-9]/g, '') || '8801831990776';
        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }

      setOrderComplete(true);
      clearCart();
      setTimeout(() => {
        setOrderComplete(false);
        setIsCheckingOut(false);
        onClose();
      }, 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Your Cart</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {orderComplete ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <Truck className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Order Placed!</h3>
                  <p className="text-zinc-500">Thank you for shopping with Kin!. We'll contact you soon.</p>
                </div>
              ) : isCheckingOut ? (
                <form onSubmit={handleCheckout} className="space-y-4">
                  <h3 className="font-bold text-lg mb-4">Shipping Details</h3>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Full Name</label>
                    <input 
                      required
                      className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Phone Number</label>
                    <input 
                      required
                      className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Address</label>
                    <textarea 
                      required
                      className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none h-24"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Shipping Area</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, area: 'Inside Dhaka'})}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.area === 'Inside Dhaka' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-black/5 hover:border-zinc-300'}`}
                      >
                        Inside Dhaka (৳60)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, area: 'Outside Dhaka'})}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.area === 'Outside Dhaka' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-black/5 hover:border-zinc-300'}`}
                      >
                        Outside Dhaka (৳120)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, payment: 'COD'})}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.payment === 'COD' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-black/5 hover:border-zinc-300'}`}
                      >
                        Cash on Delivery
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, payment: 'WhatsApp'})}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.payment === 'WhatsApp' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-black/5 hover:border-zinc-300'}`}
                      >
                        Order via WhatsApp
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors mt-6 shadow-lg shadow-indigo-200"
                  >
                    {formData.payment === 'WhatsApp' ? 'Order on WhatsApp' : `Confirm Order ৳${(total + (formData.area === 'Inside Dhaka' ? 60 : 120)).toLocaleString()}`}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="w-full py-3 text-zinc-500 text-sm font-medium"
                  >
                    Back to Cart
                  </button>
                </form>
              ) : cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map(item => (
                    <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4">
                      <img src={item.image_url} className="w-20 h-24 object-cover rounded-xl" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-900 text-sm">{item.name}</h4>
                        <div className="flex gap-2 mt-1 mb-2">
                          {item.selectedSize && <span className="text-[9px] font-bold bg-zinc-100 px-2 py-0.5 rounded uppercase tracking-widest">{item.selectedSize}</span>}
                          {item.selectedColor && <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: item.selectedColor }} />}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-zinc-100 rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor)} className="p-1 hover:text-indigo-600"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)} className="p-1 hover:text-indigo-600"><Plus className="w-3 h-3" /></button>
                          </div>
                          <span className="font-bold text-sm">৳{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)} className="text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isCheckingOut && !orderComplete && cart.length > 0 && (
              <div className="p-6 border-t border-black/5 bg-zinc-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-500 font-medium">Subtotal</span>
                  <span className="text-xl font-bold">৳{total.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-colors shadow-xl"
                >
                  Checkout Now
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ShoppingCart = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
);
