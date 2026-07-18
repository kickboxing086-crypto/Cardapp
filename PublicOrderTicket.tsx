import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Order, StoreSettings, Product } from '../types';
import { Printer, Share2, MapPin, Phone, Calendar, Clock, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function PublicOrderTicket() {
  const { storeId, orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch store data
        const storeRes = await fetch(`/api/stores/${storeId}`);
        if (!storeRes.ok) throw new Error('Loja não encontrada');
        const storeData = await storeRes.json();
        setSettings(storeData.settings);
        setProducts(storeData.products);

        // Fetch order data
        const orderRes = await fetch(`/api/stores/${storeId}/orders/${orderId}`);
        if (!orderRes.ok) throw new Error('Pedido não encontrado');
        const orderData = await orderRes.json();
        setOrder(orderData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [storeId, orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !order || !settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <CheckCircle2 className="w-16 h-16 text-gray-200 mb-4" />
        <h1 className="text-xl font-bold text-gray-800">Ops! Pedido não encontrado</h1>
        <p className="text-gray-500 text-sm text-center mt-2 max-w-xs">{error || 'Não conseguimos carregar os dados deste pedido no momento.'}</p>
        <button onClick={() => window.location.href = `/s/${storeId}`} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold transition-all active:scale-95">Voltar para a Loja</button>
      </div>
    );
  }

  const statusMap: Record<string, string> = {
    'pending': '⏳ Pendente',
    'preparing': '👨‍🍳 Em Preparo',
    'shipped': '🚚 Saiu para Entrega',
    'delivery': '🛵 Em Rota',
    'completed': '✅ Concluído',
    'canceled': '❌ Cancelado'
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <div className="mb-4 flex justify-between items-center no-print">
          <button 
            onClick={() => window.location.href = `/s/${storeId}`}
            className="text-gray-600 font-bold text-sm flex items-center gap-1 hover:text-gray-900"
          >
            ← Ir para Loja
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 bg-white text-gray-700 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm font-bold"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 relative print:shadow-none print:border-none"
        >
          {/* Ticket Header */}
          <div className="bg-gray-900 text-white p-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight">{settings.storeName}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Comanda Digital de Pedido</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Status & Protocol */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-6">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Status Interno</p>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold uppercase">
                  {statusMap[order.status] || order.status.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Protocolo</p>
                <p className="text-lg font-black font-mono text-gray-900">#{order.protocol.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            {/* Customer & Logistics */}
            <div className="space-y-4 border-b border-gray-100 pb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Cliente</p>
                  <p className="text-sm font-black text-gray-900">{order.customerName}</p>
                  <p className="text-xs text-gray-600">{order.customerPhone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Modalidade</p>
                  <p className="text-sm font-black text-gray-900">{order.deliveryMethod === 'delivery' ? 'Entrega em Endereço' : 'Retirada no Balcão'}</p>
                  {order.deliveryMethod === 'delivery' && (
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{order.address}</p>
                  )}
                </div>
              </div>

              {order.scheduledDate && (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Agendado para</p>
                    <p className="text-sm font-black text-emerald-900">
                      {new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')} 
                      <span className="mx-1.5 opacity-30">|</span>
                      {order.scheduledTime}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  Itens Selecionados
                </h3>
              </div>

              <div className="space-y-3">
                {order.items.map((item, idx) => {
                  const product = products.find(p => p.id === item.productId);
                  const addonsPrice = item.addons ? item.addons.reduce((sum, a) => sum + (a.price || 0), 0) : 0;
                  const basePrice = product ? (product.promotion && product.promoPrice && (product.promoQuantity || 1) === 1 ? product.promoPrice : product.price) : 0;
                  const calculatedItemTotal = (basePrice + addonsPrice) * item.quantity;
                  return (
                    <div key={idx} className="flex gap-3 items-start group">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center text-[10px] font-black border border-gray-200">
                        {item.quantity}x
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-black text-gray-900">
                          {product?.name || 'Produto indisponível'}
                        </p>
                        {item.flavors && item.flavors.length > 0 && (
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">
                            Sabores: {item.flavors.join(', ')}
                          </p>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.addons.map((addon, aidx) => (
                              <div key={aidx} className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                <div className="w-1 h-1 rounded-full bg-gray-300" />
                                {addon.name} (+R$ {addon.price.toFixed(2)})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-gray-900">
                          R$ {((item as any).totalPrice !== undefined && (item as any).totalPrice !== null) ? (item as any).totalPrice.toFixed(2) : calculatedItemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment & Message */}
            <div className="mt-8 pt-6 border-t border-gray-150 space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>R$ {(order.totalPrice - (order.deliveryFee || 0)).toFixed(2)}</span>
                </div>
                {(order.deliveryFee !== undefined && order.deliveryFee > 0) && (
                  <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <span>Taxa de Entrega {order.deliveryZone && <span className="lowercase normal-case font-medium ml-1 text-gray-400">({order.deliveryZone})</span>}</span>
                    <span>R$ {order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                  <span className="text-sm font-black text-gray-900 uppercase">Total Geral</span>
                  <span className="text-lg font-black text-emerald-600">R$ {order.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-gray-200">
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Forma de Pagamento</p>
                    <p className="text-xs font-black text-gray-800 uppercase italic">
                      {order.paymentMethod === 'pix' ? '💠 PIX' : 
                       order.paymentMethod === 'card_online' ? '💳 Cartão Online' :
                       order.paymentMethod === 'card' ? '💳 Cartão na Entrega' : '💵 Dinheiro'}
                    </p>
                  </div>
                  {order.paymentMethod === 'cash' && order.changeFor && (
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Troco Para</p>
                      <p className="text-xs font-black text-gray-800">R$ {order.changeFor.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {order.observation && (
                  <div className="p-4 bg-orange-50/30 border border-orange-100 rounded-2xl">
                    <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-1 shadow-xs">Observação Especial</p>
                    <p className="text-xs text-gray-700 italic font-medium">"{order.observation}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-gray-150 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" /> Pedido Registrado com Sucesso
              </div>
              <p className="text-[9px] text-gray-400 font-medium px-4 leading-relaxed">
                Este é um documento digital gerado pelo {settings.storeName}. 
                Para qualquer dúvida, entre em contato diretamente com o estabelecimento através do WhatsApp.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 text-center no-print">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Gostou da Praticidade?</p>
          <p className="text-xs text-gray-500 font-bold">Faça como o {settings.storeName} e tenha seu próprio Cardápio Digital no Cardapp.</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .min-h-screen { background: white !important; }
        }
      `}</style>
    </div>
  );
}
