"use client";

import { useState, useEffect } from "react";
import { getHiddenSeasonIds } from "@/lib/preferences";

export default function NavBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getHiddenSeasonIds().size);
    update();
    window.addEventListener("preferences-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("preferences-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-orange-800 bg-orange-100 rounded-full">
      {count}
    </span>
  );
}
