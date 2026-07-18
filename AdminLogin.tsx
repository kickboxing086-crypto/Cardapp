import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Store, ChevronRight, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [multipleStores, setMultipleStores] = useState<{ id: string; name: string; slug: string; logo: string }[] | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identity, password })
      });
      const data = await res.json();
      if (data.success) {
        if (data.multiple) {
          setMultipleStores(data.stores);
        } else {
          localStorage.setItem('admin_token', data.token);
          localStorage.setItem('store_id', data.storeId);
          if (data.isSuperAdmin) {
            localStorage.setItem('is_super_admin', 'true');
          } else {
            localStorage.removeItem('is_super_admin');
          }
          navigate('/admin');
        }
      } else {
        setError(data.error || 'Credenciais inválidas ou sem autorização');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor de autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStore = async (storeId: string) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identity, password, storeId })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('store_id', data.storeId);
        localStorage.removeItem('is_super_admin');
        navigate('/admin');
      } else {
        setError(data.error || 'Erro ao selecionar a loja');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-emerald-50 p-4 rounded-full mb-3 border border-emerald-100">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {multipleStores ? 'Selecione Sua Loja' : 'Painel de Acesso'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {multipleStores ? 'Encontramos mais de uma loja em seu cadastro:' : 'Insira suas credenciais de acesso'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl mb-6 text-xs text-center font-bold border border-rose-100">
            ⚠️ {error}
          </div>
        )}

        {multipleStores ? (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {multipleStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleSelectStore(store.id)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 border border-gray-100 rounded-2xl transition-all group disabled:opacity-50 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      ) : (
                        <Store className="w-5 h-5 text-gray-450" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{store.name}</h4>
                      <p className="text-gray-550 text-xs font-semibold font-mono">/{store.slug}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all shrink-0" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setMultipleStores(null)}
              disabled={isLoading}
              className="w-full py-3 text-gray-500 hover:text-gray-800 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">E-mail ou Usuário</label>
              <input 
                type="text" 
                required
                disabled={isLoading}
                value={identity}
                onChange={e => setIdentity(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-semibold"
                placeholder="Digite seu e-mail ou usuário"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Senha</label>
              <input 
                type="password" 
                required
                disabled={isLoading}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-semibold"
                placeholder="Sua senha secreta"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? 'Autenticando...' : 'Acessar Canal Seguro'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/termos-e-privacidade')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 transition-colors">Políticas</button>
            <button onClick={() => navigate('/termos-e-privacidade')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 transition-colors">Privacidade</button>
            <button onClick={() => window.location.href = 'mailto:suporte@cardapp.app'} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 transition-colors">Suporte</button>
          </div>
          <p className="text-[9px] font-bold text-gray-350 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} Cardapp Brasil
          </p>
        </div>
      </div>
    </div>
  );
}
