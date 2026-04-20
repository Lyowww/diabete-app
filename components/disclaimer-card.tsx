import { CircleAlert } from "lucide-react";

type DisclaimerCardProps = {
  title?: string;
  body: string;
};

export function DisclaimerCard({
  title = "Important",
  body,
}: DisclaimerCardProps) {
  return (
    <div className="glass-card rounded-3xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-50">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-amber-50/90">{body}</p>
        </div>
      </div>
    </div>
  );
}
