import { useRef } from "react";

interface FileUploadCardProps {
  label: string;
  title: string;
  description: React.ReactNode;
  icon: string;
  accept: string;
  file: File | null;
  variant: "required" | "optional";
  onFileSelect: (file: File) => void;
}

export function FileUploadCard({
  label,
  title,
  description,
  icon,
  accept,
  file,
  variant,
  onFileSelect,
}: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const isOptional = variant === "optional";
  const hasFile = file !== null;

  const borderClass = hasFile
    ? isOptional
      ? "border-amber-500 bg-amber-500/5"
      : "border-primary bg-primary/5"
    : "border-border hover:border-primary/50";

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-primary");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove("border-primary");
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-primary");
        const f = e.dataTransfer.files[0];
        if (f) onFileSelect(f);
      }}
      className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-lg border bg-card/50 px-10 py-10 text-center transition-colors ${borderClass}`}
    >
      <span className="text-3xl">{icon}</span>
      <span
        className={`font-mono text-[9px] uppercase tracking-widest ${
          isOptional ? "text-amber-500" : "text-primary"
        }`}
      >
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      <span
        className={`font-mono text-[11px] ${
          hasFile ? (isOptional ? "text-amber-500" : "text-primary") : "text-muted-foreground"
        }`}
      >
        {hasFile ? file.name : "No file selected"}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
        }}
      />
    </button>
  );
}
