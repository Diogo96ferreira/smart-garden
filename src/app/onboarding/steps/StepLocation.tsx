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

  useEffect(() => {
    const fetchDistritosMunicipios = async () => {
      try {
        console.log('🔍 Tentando carregar dados da GeoAPI...');
        const resp = await axios.get<MunicipioResponse[]>(
          'https://geoapi.pt/distritos/municipios',
          { timeout: 5000 },
        );
        setDistritos(resp.data);
        localStorage.setItem('geoapi_data', JSON.stringify(resp.data));
        console.log('✅ Dados carregados da GeoAPI');
      } catch (err) {
        console.warn('⚠️ GeoAPI falhou, a usar fallback local...', err);

        try {
          const fallbackResp = await axios.get<MunicipioResponse[]>('/data/locations.json');
          setDistritos(fallbackResp.data);
          localStorage.setItem('geoapi_data', JSON.stringify(fallbackResp.data));
          console.log('✅ Fallback local carregado com sucesso');
        } catch (fallbackErr) {
          console.error('❌ Falha ao carregar dados de fallback local', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDistritosMunicipios();
  }, []);

  const municipios = distritos.find((d) => d.distrito === selectedDistrito)?.concelhos || [];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 space-y-6 p-8">
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
          {/* Select distrito */}
          <div className="select-wrapper">
            <Label className="mb-1">District</Label>
            <Select
              value={selectedDistrito}
              onValueChange={(value) => {
                setSelectedDistrito(value);
                setSelectedMunicipio('');
              }}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select district" />
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

          {/* Select município */}
          <div className="select-wrapper">
            <Label className="mb-1">City</Label>
            <Select
              value={selectedMunicipio}
              onValueChange={(value) => setSelectedMunicipio(value)}
              disabled={!selectedDistrito}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
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

      <div className="fixed bottom-12 left-0 w-full px-6">
        <Button
          className="h-12 w-full rounded-full text-base"
          onClick={onFinish}
          disabled={!selectedMunicipio}
        >
          Finish
        </Button>
      </div>
    </div>
  );
}
