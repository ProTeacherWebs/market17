import type { BannerSlot as DbBannerSlot } from "@prisma/client";
import type { BannerSlot } from "@/lib/types";

export function toApiBannerSlot(slot: DbBannerSlot): BannerSlot {
  if (slot === "side_top") return "side-top";
  if (slot === "side_bottom") return "side-bottom";
  return "hero";
}

export function toDbBannerSlot(slot: BannerSlot): DbBannerSlot {
  if (slot === "side-top") return "side_top";
  if (slot === "side-bottom") return "side_bottom";
  return "hero";
}
