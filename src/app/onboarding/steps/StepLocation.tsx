'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type Props = {
  onBack: () => void;
  onFinish: () => void;
};

export function StepLocation({ onBack, onFinish }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 space-y-6 p-8">
      <h2 className="text-center text-4xl font-extrabold">
        Now tell us, where is your garden located?
      </h2>
      <p className="text-muted-foreground text-center text-lg">
        This will help us provide accurate weather updates and care tips.
      </p>
      <div className="select-wrapper">
        <Label className="mt-4">District</Label>
        <Select>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select district" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="lisboa">Lisboa</SelectItem>
              <SelectItem value="porto">Porto</SelectItem>
              <SelectItem value="coimbra">Coimbra</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="select-wrapper">
        <Label className="mt-4">City</Label>
        <Select>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="cascais">Cascais</SelectItem>
              <SelectItem value="gaia">Vila Nova de Gaia</SelectItem>
              <SelectItem value="aveiro">Aveiro</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="fixed bottom-12 left-0 w-full px-6">
        <Button className="w-full rounded-full" onClick={onFinish}>
          Finish
        </Button>
      </div>
    </div>
  );
}
