'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { SETTINGS_KEY } from '@/lib/settings';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LeafLoader } from '@/components/ui/Spinner';

type Props = {
  onBack: () => void;
  onNext: () => void;
};

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
        const response = await axios.get<MunicipioResponse[]>(
          'https://geoapi.pt/distritos/municipios',
          { timeout: 5000 },
        );
        setDistritos(response.data);
        localStorage.setItem('geoapi_data', JSON.stringify(response.data));
      } catch {
        try {
          const fallbackResponse = await axios.get<MunicipioResponse[]>('/data/locations.json');
          setDistritos(fallbackResponse.data);
          localStorage.setItem('geoapi_data', JSON.stringify(fallbackResponse.data));
        } catch (fallbackError) {
          console.error('Falha ao obter lista de distritos.', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    const cached = typeof window !== 'undefined' ? localStorage.getItem('geoapi_data') : null;
    if (cached) {
      setDistritos(JSON.parse(cached));
      setLoading(false);
    } else {
      fetchDistritosMunicipios();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let distrito = '';
    let municipio = '';
    const cachedLocation = localStorage.getItem('userLocation');
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation) as { distrito?: string; municipio?: string };
        distrito = parsed.distrito || '';
        municipio = parsed.municipio || '';
      } catch {
        /* ignore */
      }
    }
    if (!distrito || !municipio) {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            userLocation?: { distrito?: string; municipio?: string };
          };
          distrito ||= parsed.userLocation?.distrito || '';
          municipio ||= parsed.userLocation?.municipio || '';
        }
      } catch {
        /* ignore */
      }
    }
    if (distrito) setSelectedDistrito(distrito);
    if (municipio) setSelectedMunicipio(municipio);
  }, []);

  const municipios = useMemo(() => {
    return distritos.find((item) => item.distrito === selectedDistrito)?.concelhos ?? [];
  }, [distritos, selectedDistrito]);

  const handleNext = useCallback(() => {
    if (!selectedDistrito || !selectedMunicipio) return;

    localStorage.setItem(
      'userLocation',
      JSON.stringify({ distrito: selectedDistrito, municipio: selectedMunicipio }),
    );
    // Mirror into settings blob for central persistence
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const current = raw ? JSON.parse(raw) : {};
      const next = {
        ...current,
        userLocation: { distrito: selectedDistrito, municipio: selectedMunicipio },
      } as Record<string, unknown>;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    onNext();
  }, [onNext, selectedDistrito, selectedMunicipio]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedDistrito && selectedMunicipio) {
        event.preventDefault();
        handleNext();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNext, onBack, selectedDistrito, selectedMunicipio]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-center gap-12 px-6 text-center">
      <div className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
        <Image
          src="/onboarding/tia-mapa.png"
          width={640}
          height={420}
          alt="Tia Adélia a segurar um mapa colorido."
          className="h-auto w-full rounded-[var(--radius-md)] object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="eyebrow">🗺️ Step 3</p>
        <h2 className="text-display text-4xl leading-tight sm:text-5xl">Onde está a sua horta?</h2>
        <p className="max-w-2xl text-lg text-[var(--color-text-muted)] sm:text-xl">
          Indique-nos a localização para ajustarmos previsões, alertas e sugestões de cultivo ao seu
          clima.
        </p>
      </div>

      {loading ? (
        <LeafLoader label="A recolher distritos de Portugal..." />
      ) : (
        <div className="flex w-full flex-col gap-6 text-left sm:flex-row sm:justify-center">
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Label>Distrito</Label>
            <Select
              value={selectedDistrito}
              onValueChange={(value) => {
                setSelectedDistrito(value);
                setSelectedMunicipio('');
              }}
              placeholder="Selecione o distrito"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {distritos.map((item) => (
                    <SelectItem key={item.distrito} value={item.distrito}>
                      {item.distrito}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-2">
            <Label>Concelho</Label>
            <Select
              value={selectedMunicipio}
              onValueChange={setSelectedMunicipio}
              placeholder="Selecione o concelho"
              disabled={!selectedDistrito}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o concelho" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {municipios.map((municipio) => (
                    <SelectItem key={municipio} value={municipio}>
                      {municipio}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex w-full max-w-md gap-3">
        <Button variant="secondary" size="lg" className="w-full" onClick={onBack}>
          Voltar
        </Button>
        <Button
          size="lg"
          className="w-full"
          onClick={handleNext}
          disabled={!selectedDistrito || !selectedMunicipio}
        >
          Continuar
        </Button>
      </div>
    </section>
  );
}
