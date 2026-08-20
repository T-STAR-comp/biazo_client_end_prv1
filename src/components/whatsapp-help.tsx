import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { publicApi } from "@/lib/api";

const FALLBACK = {
  whatsappUrl: "https://wa.me/265999000000",
  conciergePhone: "+265 999 000 000",
};

export function WhatsAppHelp() {
  const [support, setSupport] = useState(FALLBACK);

  useEffect(() => {
    publicApi
      .getSupport()
      .then((data) => setSupport({ whatsappUrl: data.whatsappUrl, conciergePhone: data.conciergePhone }))
      .catch(() => null);
  }, []);

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-2 lg:bottom-6">
      <a
        href={support.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex max-w-[14rem] items-center gap-2 rounded-full border border-hairline bg-background px-4 py-2.5 text-sm font-medium text-ink shadow-lg transition-colors hover:border-signal/40 hover:bg-signal-soft"
        aria-label="Chat with Biazo on WhatsApp"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366] text-white">
          <MessageCircle className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          Need help?
          <span className="block text-xs font-normal text-muted-foreground">Message us on WhatsApp</span>
        </span>
      </a>
      <p className="rounded-full bg-background/90 px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
        Or call {support.conciergePhone}
      </p>
    </div>
  );
}
