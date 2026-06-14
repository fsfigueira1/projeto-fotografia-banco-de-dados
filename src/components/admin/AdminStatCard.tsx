interface AdminStatCardProps {
  label: string;
  value: number | string;
  tone?: "neutral" | "accent" | "success";
}

const toneClasses = {
  neutral: "border-white/10 bg-white/[0.04]",
  accent: "border-red-400/20 bg-red-500/[0.08]",
  success: "border-emerald-400/20 bg-emerald-500/[0.07]"
};

export function AdminStatCard({
  label,
  value,
  tone = "neutral"
}: AdminStatCardProps) {
  return (
    <article className={`rounded-[1.35rem] border p-5 ${toneClasses[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
        {value}
      </div>
    </article>
  );
}
