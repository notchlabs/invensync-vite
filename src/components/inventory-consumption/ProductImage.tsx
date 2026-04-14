import { Package } from "lucide-react";
import { useState } from "react";

export function ProductImage({ src, name }: { src: string | null; name: string }) {
    const [err, setErr] = useState(false)
    if (src && !err) {
      return (
        <img src={src} alt={name} onError={() => setErr(true)} className="w-full h-full object-cover" />
      )
    }
    return <Package size={22} className="text-muted-text/40" />
  }
  