interface DiagnosisScaleIndicatorProps {
  value: number;
  label: string;
  displayValue?: string;
}

export function DiagnosisScaleIndicator({ value, label, displayValue = `${value} de 5` }: DiagnosisScaleIndicatorProps) {
  return <div role="img" aria-label={`${label}: ${displayValue}`} className="space-y-2">
    <span aria-hidden="true" className="block text-base font-semibold text-foreground">{displayValue}</span>
    <div aria-hidden="true" className="flex items-center gap-2">
      {Array.from({ length: 5 }, (_, index) => <span key={index} className={
        index < value
          ? "size-2.5 shrink-0 rounded-full border border-accent bg-accent"
          : "size-2.5 shrink-0 rounded-full border border-accent/60 bg-surface"
      } />)}
    </div>
  </div>;
}
