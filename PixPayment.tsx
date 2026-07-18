import React from 'react';
import { MessageSquare, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PixPayment() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black mb-3 tracking-tight text-gray-900">Ative Sua Assinatura</h2>
        <p className="text-gray-500 mb-8 text-sm font-medium leading-relaxed">
          Para concluir o seu cadastro e ativar a sua licença de alta performance com segurança, entre em contato diretamente com o nosso suporte oficial da <strong>SF TECNOLOGIA</strong> via WhatsApp.
        </p>
        
        <button 
          onClick={() => {
            const message = encodeURIComponent("Olá SF Tecnologia! Quero ativar a minha assinatura de plano da minha loja digital.");
            window.open(`https://wa.me/5584999857391?text=${message}`, '_blank');
          }}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer border-none"
        >
          <MessageSquare className="w-4 h-4" /> Solicitar Ativação no WhatsApp
        </button>

        <button 
          onClick={() => navigate('/register')}
          className="mt-6 text-gray-400 font-bold text-xs flex items-center justify-center gap-2 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Registro
        </button>
      </div>
    </div>
  );
}
