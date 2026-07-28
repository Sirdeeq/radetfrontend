import { cn } from "@/lib/utils";

export default function Logo({ classNameFull, classNameMobile }: { classNameFull?: string; classNameMobile?: string }) {
  return (
    <>
      <img
        src="/Logo Complete.png"
        alt="RADET"
        className={cn("h-7 w-auto", classNameFull)}
      />
      <img
        src="/LogoIcon.png"
        alt="RADET"
        className={cn("h-7 w-auto", classNameMobile)}
      />
    </>
  );
}
