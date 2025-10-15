'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/**
 * Tipo das tabs aceites pelo componente
 */
export interface LineTab {
  label: string;
  value: string;
  content?: React.ReactNode;
}

/**
 * Componente genérico de Tabs com linha inferior animada
 */
export function LineTabs({
  tabs,
  defaultValue,
  className,
}: {
  tabs: LineTab[];
  defaultValue?: string;
  className?: string;
}) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.value);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={cn('w-full', className)}>
      {/* Cabeçalho das tabs */}
      <TabsList className="relative flex w-full justify-center border-b border-gray-200 bg-transparent">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.value ? 'text-green-700' : 'text-gray-400 hover:text-gray-600',
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-green-500 transition-all duration-200" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Conteúdo das tabs */}
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="pt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
