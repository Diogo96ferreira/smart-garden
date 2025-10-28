'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type Props = { onBack: () => void; onFinish: () => void };

interface MunicipioResponse {
  distrito: string;
  concelhos: string[];
}

export function StepLocation({ onBack, onFinish }: Props) {
  const router = useRouter();
  const [distritos, setDistritos] = useState<MunicipioResponse[]>([]);
  const [selectedDistrito, setSelectedDistrito] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistritosMunicipios = async () => {
      try {
        const resp = await axios.get<MunicipioResponse[]>(
          'https://geoapi.pt/distritos/municipios',
          {
            timeout: 5000,
          },
        );
        setDistritos(resp.data);
        localStorage.setItem('geoapi_data', JSON.stringify(resp.data));
      } catch {
        try {
          const fallbackResp = await axios.get<MunicipioResponse[]>('/data/locations.json');
          setDistritos(fallbackResp.data);
          localStorage.setItem('geoapi_data', JSON.stringify(fallbackResp.data));
        } catch (fallbackErr) {
          console.error('Falha ao obter dados de localização:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    const cached = localStorage.getItem('geoapi_data');
    if (cached) {
      setDistritos(JSON.parse(cached));
      setLoading(false);
    } else {
      void fetchDistritosMunicipios();
    }
  }, []);

  useEffect(() => {
    if (!distritos.length) return;

    const storedLocation = localStorage.getItem('userLocation');
    if (!storedLocation) return;

    try {
      const parsed = JSON.parse(storedLocation) as { distrito?: string; municipio?: string };
      if (parsed.distrito && distritos.some((d) => d.distrito === parsed.distrito)) {
        setSelectedDistrito(parsed.distrito);
      }
      if (parsed.municipio) {
        setSelectedMunicipio(parsed.municipio);
      }
    } catch (error) {
      console.warn('Não foi possível restaurar a localização guardada.', error);
    }
  }, [distritos]);

  const municipios = distritos.find((d) => d.distrito === selectedDistrito)?.concelhos ?? [];

  const handleFinish = useCallback(() => {
    localStorage.setItem(
      'userLocation',
      JSON.stringify({ distrito: selectedDistrito, municipio: selectedMunicipio }),
    );
    localStorage.setItem('onboardingComplete', 'true');
    onFinish();
    router.push('/splash');
  }, [selectedDistrito, selectedMunicipio, onFinish, router]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedDistrito && selectedMunicipio) {
        event.preventDefault();
        handleFinish();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedDistrito, selectedMunicipio, onBack, handleFinish]);

  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-emerald-900">
        <div className="space-y-3 text-center">
          <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">Onde fica</p>
          <h2 className="text-3xl font-semibold">Em que terra floresce o teu jardim?</h2>
          <p className="text-sm text-emerald-700/80">
            Assim afinamos conselhos e previsões do tempo.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-emerald-200 bg-white/70 p-10 text-sm text-emerald-700/80">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            A recolher distritos e concelhos...
          </div>
        ) : (
          <>
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Distrito
              <select
                value={selectedDistrito}
                onChange={(event) => {
                  setSelectedDistrito(event.target.value);
                  setSelectedMunicipio('');
                }}
                className="w-full rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="">Escolhe o distrito</option>
                {distritos.map((item) => (
                  <option key={item.distrito} value={item.distrito}>
                    {item.distrito}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Município
              <select
                value={selectedMunicipio}
                onChange={(event) => setSelectedMunicipio(event.target.value)}
                disabled={!selectedDistrito}
                className="w-full rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none disabled:opacity-50"
              >
                <option value="">Escolhe a cidade</option>
                {municipios.map((municipio) => (
                  <option key={municipio} value={municipio}>
                    {municipio}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full px-4 py-2 font-medium text-emerald-600 transition hover:text-emerald-800"
          >
            voltar
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={!selectedMunicipio}
            className="rounded-full bg-emerald-500 px-6 py-2 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            terminar
          </button>
        </div>
      </div>
    </section>
  );
}
