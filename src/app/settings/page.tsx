'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, RotateCcw } from 'lucide-react';

type Preferences = {
  notifications: boolean;
  wateringReminders: boolean;
  aiTips: boolean;
  measurement: 'metric' | 'imperial';
  personaTone: 'tradicional' | 'directa';
};

type ToggleKey = 'notifications' | 'wateringReminders' | 'aiTips';

const defaultPreferences: Preferences = {
  notifications: true,
  wateringReminders: true,
  aiTips: true,
  measurement: 'metric',
  personaTone: 'tradicional',
};

export default function SettingsPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setName(storedName);

    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation) as { distrito?: string; municipio?: string };
        setDistrict(parsed.distrito ?? '');
        setCity(parsed.municipio ?? '');
      } catch (error) {
        console.warn('Não foi possível carregar a localização guardada.', error);
      }
    }

    const storedPreferences = localStorage.getItem('userPreferences');
    if (storedPreferences) {
      try {
        const parsed = JSON.parse(storedPreferences) as Preferences;
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.warn('Não foi possível carregar as preferências guardadas.', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 3500);
    return () => clearTimeout(timer);
  }, [status]);

  const saveSettings = () => {
    localStorage.setItem('userName', name.trim());
    localStorage.setItem(
      'userLocation',
      JSON.stringify({ distrito: district.trim(), municipio: city.trim() }),
    );
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    setStatus('Preferências guardadas com sucesso.');
  };

  const togglePreference = (key: ToggleKey) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const canSave = useMemo(() => {
    return Boolean(name.trim() && city.trim());
  }, [name, city]);

  const resetOnboarding = () => {
    localStorage.removeItem('onboardingComplete');
    setStatus('Onboarding reiniciado. Vais voltar a falar com a Tia Adélia.');
    router.push('/onboarding');
  };

  return (
    <main className="min-h-screen px-6 py-8 pb-24">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-green-800">Settings & Preferences</h1>
          <p className="text-sm text-gray-600">
            Ajusta as notificações, actualiza o teu perfil e diz-nos como gostas que a Tia Adélia
            fale contigo.
          </p>
        </header>

        {status && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <span>{status}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Actualiza os dados básicos do teu jardim.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como te devo chamar?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Beja"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Distrito</Label>
                <Input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Ex: Évora"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measurement">Unidades de medida</Label>
                <Select
                  value={preferences.measurement}
                  onValueChange={(value) =>
                    setPreferences((prev) => ({
                      ...prev,
                      measurement: value as Preferences['measurement'],
                    }))
                  }
                >
                  <SelectTrigger id="measurement">
                    <SelectValue placeholder="Escolhe o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Sistema métrico (°C)</SelectItem>
                    <SelectItem value="imperial">Sistema imperial (°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={saveSettings}
              disabled={!canSave}
              className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-70"
            >
              Guardar alterações
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Decide quando queres ser avisado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                {
                  key: 'notifications' as const,
                  title: 'Alertas gerais',
                  description: 'Recebe actualizações importantes sobre o teu jardim.',
                },
                {
                  key: 'wateringReminders' as const,
                  title: 'Lembretes de rega',
                  description: 'Avisos sempre que uma planta estiver a precisar de água.',
                },
                {
                  key: 'aiTips' as const,
                  title: 'Sugestões da Tia Adélia',
                  description: 'Deixa que a Tia Adélia te dê conselhos personalizados.',
                },
              ] as const
            ).map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/70 px-4 py-3"
              >
                <div className="max-w-xs">
                  <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePreference(item.key)}
                  className={clsx(
                    'flex h-8 w-14 items-center rounded-full p-1 transition-colors',
                    preferences[item.key]
                      ? 'justify-end bg-green-500'
                      : 'justify-start bg-gray-300',
                  )}
                  aria-pressed={preferences[item.key] ? 'true' : 'false'}
                >
                  <span className="h-6 w-6 rounded-full bg-white shadow" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como queres ouvir a Tia Adélia?</CardTitle>
            <CardDescription>Ajusta o tom e o estilo das respostas da tua mentora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={preferences.personaTone}
              onValueChange={(value) =>
                setPreferences((prev) => ({
                  ...prev,
                  personaTone: value as Preferences['personaTone'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolhe o estilo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tradicional">
                  Tradicional – pausada e doce, como na aldeia.
                </SelectItem>
                <SelectItem value="directa">Directa – conselhos rápidos e práticos.</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Guardamos estas preferências para adaptar o prompt enviado ao Gemini sempre que
              conversas com a Tia Adélia.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voltar ao onboarding</CardTitle>
            <CardDescription>
              Se quiseres repetir a experiência inicial e actualizar tudo de raiz.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={resetOnboarding}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Recomeçar onboarding
            </Button>
            <p className="text-xs text-gray-500">
              Perdes apenas o estado do onboarding – os dados do jardim permanecem.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
