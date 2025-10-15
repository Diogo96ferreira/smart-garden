import { LineTabs } from '@/components/ui/InlineTabs';

export default function MyGarden() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl bg-white p-6 shadow">
      <h1 className="mb-4 text-center text-lg font-semibold">My Garden</h1>

      <LineTabs
        defaultValue="horta"
        tabs={[
          {
            label: 'Horta',
            value: 'horta',
            content: <div className="text-center text-sm text-gray-600">🌿 Plantas da horta</div>,
          },
          {
            label: 'Pomar',
            value: 'pomar',
            content: <div className="text-center text-sm text-gray-600">🍊 Árvores do pomar</div>,
          },
        ]}
      />
    </div>
  );
}
