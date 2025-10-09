import Image from 'next/image';

export function LeafLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="animate-leaf relative h-16 w-16">
        <Image src="/spinner.png" alt="Loading leaf" fill sizes="64px" className="object-contain" />
      </div>
      <p className="text-muted-foreground animate-pulse text-sm">Growing your garden...</p>
    </div>
  );
}
