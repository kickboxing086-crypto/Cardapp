import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Store, Smartphone, ShieldCheck, Zap, BarChart } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/admin/login');
  };

  const handleMonthlyPlan = () => {
    navigate('/pix-payment');
  };

  const handleWhatsappRequest = () => {
    navigate('/register');
  };

  const handlePlanCheckout = (planName: string, price: string) => {
    const message = encodeURIComponent(`Olá! Quero assinar o plano ${planName} (R$ ${price}) da loja digital.`);
    window.location.href = `https://wa.me/5584999857391?text=${message}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-100">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-zinc-950/80 backdrop-blur-md z-50 border-b border-white/5 h-20 flex items-center justify-between px-6 md:px-12 transition-all">
        {/* Centered Logo */}
        <div className="absolute inset-x-0 w-full flex justify-center pointer-events-none">
          <span className="text-3xl font-black tracking-tighter text-white pointer-events-auto flex items-center gap-1">
            Cardapp
            <span className="text-amber-500">.</span>
          </span>
        </div>
        
        {/* Login Button (Right) */}
        <div className="flex-1 flex justify-end">
          <button 
            onClick={handleStart}
            className="text-sm font-bold text-zinc-300 hover:text-white transition-all hover:scale-105 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10"
          >
            Acessar Painel
          </button>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950 -z-10" />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-amber-500/20 shadow-sm animate-fade-in-up backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Pronto para Escalar seu Negócio
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-white max-w-5xl leading-[0.9] mb-8 drop-shadow-sm">
            Venda muito mais com o <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Cardapp.</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-zinc-400 max-w-3xl font-medium mb-12 leading-relaxed">
            A plataforma definitiva para automatizar seu delivery. Segurança, velocidade e <span className="text-white font-bold">zero burocracia</span> para você focar no que importa: seu produto.
          </p>

          <button 
            onClick={handleWhatsappRequest}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-zinc-950 rounded-full font-black text-lg overflow-hidden shadow-xl shadow-amber-500/20 hover:scale-105 transition-all hover:bg-amber-400 active:scale-95"
          >
            <span>Abrir loja digital por 7 dias grátis</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="mt-5 text-sm font-bold text-zinc-500">Sem compromisso • Teste gratuito liberado</p>
        </section>

        {/* Features / Trust Section */}
        <section className="px-6 py-24 bg-zinc-900/50 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                Tudo o que sua loja precisa.
              </h2>
              <p className="text-zinc-400 font-medium max-w-2xl mx-auto">
                Desenhado especificamente para as necessidades do comércio rápido. Performance de luxo, design minimalista e extremamente seguro.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Store,
                  title: "Feito para Qualquer Negócio",
                  desc: "Ideal para o dinamismo do seu comércio. Atualize preços e disponibilidade de produtos em segundos."
                },
                {
                  icon: ShieldCheck,
                  title: "Total Confiança e Segurança",
                  desc: "Seus clientes terão um ambiente seguro e profissional para comprar. Pedidos chegam organizados."
                },
                {
                  icon: Zap,
                  title: "Performance Premium",
                  desc: "Sistema ultrarrápido, sem travamentos. Funciona perfeitamente em áreas com sinal de internet fraco."
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-zinc-950 p-8 rounded-3xl border border-white/5 shadow-sm hover:border-white/10 transition-colors">
                  <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>



      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="text-2xl font-black tracking-tighter text-white mb-4">
            Cardapp<span className="text-amber-500">.</span>
          </span>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
            <button onClick={() => navigate('/termos-e-privacidade')} className="text-sm font-bold text-zinc-500 hover:text-amber-400 transition-colors">Termos de Uso</button>
            <button onClick={() => navigate('/termos-e-privacidade')} className="text-sm font-bold text-zinc-500 hover:text-amber-400 transition-colors">Privacidade</button>
            <button onClick={() => navigate('/admin/login')} className="text-sm font-bold text-zinc-500 hover:text-amber-400 transition-colors">Admin</button>
            <button onClick={() => window.location.href = 'mailto:suporte@cardapp.app'} className="text-sm font-bold text-zinc-500 hover:text-amber-400 transition-colors">Suporte</button>
          </div>

          <div className="w-full h-px bg-white/5 mb-8" />

          <p className="text-zinc-600 text-xs font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} Cardapp Brasil. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
