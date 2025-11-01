'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface LineTab {
  label: string;
  value: string;
  content?: React.ReactNode;
}

type LineTabsProps = {
  tabs: LineTab[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

export function LineTabs({ tabs, defaultValue, onValueChange, className }: LineTabsProps) {
  const initialValue = defaultValue ?? tabs[0]?.value ?? '';

  return (
    <Tabs
      defaultValue={initialValue}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      <TabsList className="flex w-full gap-6 border-b border-[var(--color-border)] bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="relative rounded-none px-0 pb-2 text-sm font-semibold text-[var(--color-text-muted)] transition-colors"
            activeClassName="text-[var(--color-primary-strong)] after:absolute after:-bottom-[1px] after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[var(--color-primary)] after:content-['']"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
