import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, FileText, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function TermsAndPrivacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-black text-lg tracking-tight">Cardapp<span className="text-emerald-500">.</span></span>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Políticas e Privacidade</h1>
              <p className="text-gray-500 font-medium">Última atualização: Julho de 2026</p>
            </div>
          </div>

          <div className="space-y-12">
            {/* Terms of Use */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-black text-gray-900">Termos de Uso</h2>
              </div>
              <div className="prose prose-emerald max-w-none text-gray-600 leading-relaxed space-y-4">
                <p>
                  Bem-vindo ao <strong>Cardapp</strong>. Ao utilizar nossa plataforma, você concorda com os termos descritos abaixo. O Cardapp é uma plataforma de intermediação tecnológica que permite a criação de cardápios digitais e a gestão de pedidos.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Uso da Plataforma:</strong> O Cardapp fornece a tecnologia para que lojistas gerenciem seus próprios pedidos. Não nos responsabilizamos pela entrega ou qualidade dos produtos vendidos pelos lojistas.</li>
                  <li><strong>Responsabilidade do Usuário:</strong> Você é responsável por manter a segurança de sua conta e senha.</li>
                  <li><strong>Propriedade Intelectual:</strong> Toda a tecnologia e design da plataforma são de propriedade exclusiva do Cardapp.</li>
                  <li><strong>Modificações:</strong> Reservamo-nos o direito de alterar estes termos a qualquer momento para refletir melhorias no serviço ou mudanças legais.</li>
                </ul>
              </div>
            </section>

            {/* Privacy Policy */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-black text-gray-900">Política de Privacidade</h2>
              </div>
              <div className="prose prose-emerald max-w-none text-gray-600 leading-relaxed space-y-4">
                <p>
                  Sua privacidade é fundamental para nós. Esta política detalha como coletamos e protegemos seus dados.
                </p>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-2">Quais dados coletamos?</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Informações de cadastro (nome, e-mail, telefone) para gestão da loja.</li>
                    <li>Dados de pedidos (produtos, endereço de entrega) para processamento pelo lojista.</li>
                    <li>Logs técnicos para garantir a estabilidade e segurança do sistema.</li>
                  </ul>
                </div>
                <p>
                  <strong>Segurança dos Dados:</strong> Utilizamos criptografia de ponta e protocolos de segurança avançados para garantir que suas informações e as de seus clientes estejam protegidas. Não vendemos dados de usuários para terceiros em nenhuma circunstância.
                </p>
                <p>
                  <strong>Seus Direitos:</strong> Você pode solicitar a exclusão de sua conta e de todos os dados associados a qualquer momento através do painel administrativo ou suporte oficial.
                </p>
              </div>
            </section>
          </div>
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm font-bold">
            Dúvidas? Entre em contato: <span className="text-emerald-600">contato@cardapp.app</span>
          </p>
        </div>
      </main>
    </div>
  );
}
