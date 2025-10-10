'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
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
  onFinish: () => void;
};

interface MunicipioResponse {
  distrito: string;
  concelhos: string[];
}

export function StepLocation({ onBack, onFinish }: Props) {
  const [distritos, setDistritos] = useState<MunicipioResponse[]>([]);
  const [selectedDistrito, setSelectedDistrito] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // 🔄 GeoAPI + fallback local
  useEffect(() => {
    const fetchDistritosMunicipios = async () => {
      try {
        const resp = await axios.get<MunicipioResponse[]>(
          'https://geoapi.pt/distritos/municipios',
          { timeout: 5000 },
        );
        setDistritos(resp.data);
        localStorage.setItem('geoapi_data', JSON.stringify(resp.data));
      } catch {
        try {
          const fallbackResp = await axios.get<MunicipioResponse[]>('/data/locations.json');
          setDistritos(fallbackResp.data);
          localStorage.setItem('geoapi_data', JSON.stringify(fallbackResp.data));
        } catch (fallbackErr) {
          console.error('❌ Fallback local falhou:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    // tenta cache primeiro (opcional)
    const cached = localStorage.getItem('geoapi_data');
    if (cached) {
      setDistritos(JSON.parse(cached));
      setLoading(false);
    } else {
      fetchDistritosMunicipios();
    }
  }, []);

  const municipios = distritos.find((d) => d.distrito === selectedDistrito)?.concelhos || [];

  const handleFinish = () => {
    localStorage.setItem('onboardingComplete', 'true');
    onFinish(); // continua o flow normal
  };

  // 🎯 Global: Enter → finish, Esc → back (pausa quando um Select está aberto)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (menuOpen) return;

      if (e.key === 'Enter' && selectedDistrito && selectedMunicipio) {
        e.preventDefault();
        onFinish();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [menuOpen, selectedDistrito, selectedMunicipio, onFinish, onBack]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-8">
      <h2 className="text-center text-4xl font-extrabold">
        Now tell us, where is your garden located?
      </h2>
      <p className="text-muted-foreground text-center text-lg">
        This will help us provide accurate weather updates and care tips.
      </p>

      {loading ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center">
          <LeafLoader />
        </div>
      ) : (
        <>
          {/* Distrito */}
          <div className="select-wrapper">
            <Label className="mb-2 text-lg">District</Label>
            <Select
              value={selectedDistrito}
              onValueChange={(value) => {
                setSelectedDistrito(value);
                setSelectedMunicipio('');
              }}
              onOpenChange={setMenuOpen}
            >
              <SelectTrigger className="smart-select-trigger w-[280px]">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="center"
                className="smart-select-content"
                // 🔑 impede o Radix de voltar a focar o Trigger quando fecha
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
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

          {/* Município */}
          <div className="select-wrapper">
            <Label className="mb-2 text-lg">City</Label>
            <Select
              value={selectedMunicipio}
              onValueChange={setSelectedMunicipio}
              disabled={!selectedDistrito}
              onOpenChange={setMenuOpen}
            >
              <SelectTrigger className="smart-select-trigger w-[280px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="center"
                className="smart-select-content"
                // 🔑 idem
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <SelectGroup>
                  {municipios.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* CTA */}
      <div className="fixed right-0 bottom-12 left-0 px-6">
        <div className="mx-auto max-w-md">
          <Button
            className="btn-primary h-12 min-h-12 w-full text-base leading-none"
            onClick={handleFinish}
            disabled={!selectedMunicipio}
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
}
