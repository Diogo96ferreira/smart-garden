'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { MapPin } from 'lucide-react';

type Props = { onBack: () => void; onNext: () => void };

interface MunicipioResponse {
  distrito: string;
  concelhos: string[];
}

export function StepLocation({ onBack, onNext }: Props) {
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

  const handleContinue = useCallback(() => {
    if (!selectedDistrito || !selectedMunicipio) return;
    localStorage.setItem(
      'userLocation',
      JSON.stringify({ distrito: selectedDistrito, municipio: selectedMunicipio }),
    );
    onNext();
  }, [onNext, selectedDistrito, selectedMunicipio]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedDistrito && selectedMunicipio) {
        event.preventDefault();
        handleContinue();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedDistrito, selectedMunicipio, onBack, handleContinue]);

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9)_0%,_rgba(220,252,231,0.65)_55%,_rgba(214,238,210,0.95)_100%)]" />
      <div className="mx-auto grid w-full max-w-5xl gap-12 rounded-[32px] bg-white/80 p-10 shadow-xl shadow-emerald-900/5 backdrop-blur xl:grid-cols-[1.15fr,0.85fr]">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-4">
            <span className="chip-soft inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Passo 2 de 6
            </span>
            <h2 className="text-3xl font-semibold text-emerald-900">
              Em que terra floresce o teu jardim?
            </h2>
            <p className="text-sm text-emerald-900/70">
              Assim afinamos conselhos, previsões do tempo e sugestões de cultivo segundo a tua
              região.
            </p>
          </div>
          {loading ? (
            <div className="glass-card flex flex-col items-center justify-center gap-3 rounded-[28px] p-12 text-sm text-emerald-900/70">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              A recolher distritos e concelhos...
            </div>
          ) : (
            <div className="grid gap-6 text-sm text-emerald-900/80">
              <label className="space-y-2">
                <span className="text-xs tracking-[0.28em] text-emerald-500 uppercase">
                  Distrito
                </span>
                <div className="glass-card flex items-center gap-3 rounded-[24px] px-5 py-4">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  <select
                    value={selectedDistrito}
                    onChange={(event) => {
                      setSelectedDistrito(event.target.value);
                      setSelectedMunicipio('');
                    }}
                    className="sg-input sg-select w-full border-none bg-transparent px-0 focus-visible:shadow-none"
                  >
                    <option value="">Escolhe o distrito</option>
                    {distritos.map((item) => (
                      <option key={item.distrito} value={item.distrito}>
                        {item.distrito}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-xs tracking-[0.28em] text-emerald-500 uppercase">
                  Município
                </span>
                <div className="glass-card flex items-center gap-3 rounded-[24px] px-5 py-4">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  <select
                    value={selectedMunicipio}
                    onChange={(event) => setSelectedMunicipio(event.target.value)}
                    disabled={!selectedDistrito}
                    className="sg-input sg-select w-full border-none bg-transparent px-0 focus-visible:shadow-none disabled:opacity-50"
                  >
                    <option value="">Escolhe a cidade</option>
                    {municipios.map((municipio) => (
                      <option key={municipio} value={municipio}>
                        {municipio}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[28px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6">
          <div className="space-y-3 text-sm text-emerald-900/70">
            <p className="font-semibold text-emerald-900">Porquê perguntar isto?</p>
            <p>
              A meteorologia local e os dados de humidade do solo mudam a cada região. Assim
              conseguimos avisar-te quando o frio chega ou quando a rega precisa de ajuste.
            </p>
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-xs">
              <p className="font-semibold text-emerald-900">Dica da Tia Adélia</p>
              <p>
                “No Alentejo espero pelo nascer do sol para regar — cada terra tem o seu segredo.”
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-emerald-800">
            <button type="button" onClick={onBack} className="btn-secondary">
              Voltar
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedMunicipio}
              className="btn-primary disabled:opacity-60"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
