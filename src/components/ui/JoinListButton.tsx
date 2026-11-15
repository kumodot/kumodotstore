import { useState } from "react";
import { SITE } from "@/config/site.ts";
import { KUSTOMIZER_PRODUCTS } from "@/data/kustomizerProducts.ts";
import { Scramble } from "./Scramble.tsx";
import { NotifyModal } from "./NotifyModal.tsx";

/** FM1_Kz waiting list button + its modal. It only exists while an FM1 listing is not live yet. */
export function JoinListButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pending = KUSTOMIZER_PRODUCTS.some((p) => p.kind !== "grid" && !p.launched);
  if (!pending) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`btn-brand inline-flex items-center justify-center bg-text-primary text-[#0D0D0C]
                    font-mono text-xs font-medium uppercase tracking-[.06em] cursor-pointer
                    min-h-10 px-4 ${className}`}
      >
        <Scramble text="FM1_Kz Waiting List" />
      </button>
      {open && (
        <NotifyModal
          productId={SITE.waitlist.id}
          productName={SITE.waitlist.name}
          type="launch"
          title="FM1_Kz waiting list"
          blurb={`The FM1_Kz cases and knobs are almost here. Join the list and get ${SITE.waitlist.discountPercent}% off at launch, we will email you when the listing goes live.`}
          discountCode={SITE.waitlist.discountCode}
          discountPercent={SITE.waitlist.discountPercent}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
