import React, { useState } from 'react';
import { firestoreAdapter } from '../../firebase/firestoreAdapter';
import { useAuthStore } from '../../stores/authStore';
import { useReferenceData } from '../../hooks/useReferenceData';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export const AddOrderForm: React.FC<{ onCreated?: (id: string) => void }> = ({ onCreated }) => {
  const user = useAuthStore((s) => s.user);
  const { items: priorities } = useReferenceData('PRIORITIES');
  const { items: sectors } = useReferenceData('SECTORS');

  const [client, setClient] = useState('');
  const [product, setProduct] = useState('');
  const [type, setType] = useState('');
  const [colors, setColors] = useState('');
  const [sector, setSector] = useState('');
  const [priority, setPriority] = useState(priorities[0]?.code || 'normal');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !product.trim()) {
      setErrorMsg('Заполните клиента и продукт');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const order = {
        orderNumber: `O-${Date.now().toString().slice(-6)}`,
        client: client.trim(),
        product: product.trim(),
        details: { type, colors },
        sector: sector || null,
        priority: priority || 'normal',
        notes: notes.trim() || null,
        status: 'new',
        createdBy: user?.uid || 'anon',
      };

      const id = await firestoreAdapter.addOrder(order);
      setSuccess(true);
      setClient(''); setProduct(''); setType(''); setColors(''); setNotes('');
      if (onCreated) onCreated(id);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось создать заказ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Новый заказ</h2>

      {success && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400">
          <FiCheckCircle /> Заказ создан!
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
          <FiAlertCircle /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Клиент *"
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
        />
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="Продукт / Услуга *"
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Тип (Цифра, Офсет...)"
            className="p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
          />
          <input
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            placeholder="Цвета (4+4, 1+0...)"
            className="p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {sectors.length > 0 && (
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="" className="bg-gray-900">Сектор (необязательно)</option>
            {sectors.map((s) => (
              <option key={s.code} value={s.code} className="bg-gray-900">{s.label}</option>
            ))}
          </select>
        )}

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
        >
          {priorities.length > 0 ? priorities.map((p) => (
            <option key={p.code} value={p.code} className="bg-gray-900">{p.label}</option>
          )) : (
            <option value="normal" className="bg-gray-900">Обычный</option>
          )}
        </select>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Примечания..."
          rows={2}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none resize-none"
        />

        <button
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Создание...' : 'Создать заказ'}
        </button>
      </form>
    </div>
  );
};
