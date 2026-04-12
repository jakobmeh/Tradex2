import Image from "next/image";
import type { ReactNode } from "react";

function BrandMark() {
  return (
    <Image
      src="/logo.png"
      alt="AlphaLedger"
      width={600}
      height={600}
      priority
      className="h-[154px] w-[470px] object-contain sm:h-[172px] sm:w-[540px] lg:h-[198px] lg:w-[680px]"
    />
  );
}

export function AuthShell({
  title,
  description,
  chips,
  formTitle,
  formDescription,
  children,
}: {
  title: string;
  description: string;
  chips: string[];
  formTitle: string;
  formDescription: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#050505_0%,#090806_42%,#030303_100%)] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[240px] bg-[linear-gradient(180deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.92)_58%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_58%)]" />
        <div className="absolute -left-[25rem] top-[2rem] h-[56rem] w-[56rem] rounded-full border border-white/6 bg-[radial-gradient(circle_at_35%_38%,rgba(214,163,73,0.16),rgba(95,67,24,0.12)_23%,rgba(18,14,9,0.48)_48%,transparent_72%)] shadow-[0_0_140px_rgba(115,82,24,0.18)]" />
        <div className="absolute -left-[16rem] top-[10rem] h-[38rem] w-[38rem] rounded-full border border-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),rgba(179,132,49,0.08)_18%,rgba(10,10,10,0.02)_58%,transparent_76%)]" />
        <div className="absolute left-[5rem] top-[24rem] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(198,147,58,0.14)_0%,rgba(88,61,18,0.06)_36%,transparent_68%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.9))]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1240px] flex-col">
        <header className="flex justify-center pb-4 pt-2 lg:pb-6">
          <BrandMark />
        </header>

        <div className="grid flex-1 items-start gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="hidden min-h-[34rem] rounded-[2rem] border border-[#7e6330]/22 bg-[linear-gradient(180deg,rgba(16,16,16,0.96),rgba(9,9,9,0.94))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.48)] backdrop-blur md:flex md:flex-col md:justify-between lg:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-[#d9bd79]/68">
                Neural Trading Layer
              </p>
              <h1 className="mt-7 max-w-[12ch] text-5xl font-medium leading-[0.98] tracking-[-0.04em] text-[#fff5db] lg:text-[4.1rem]">
                {title}
              </h1>
              <p className="mt-7 max-w-md text-lg leading-8 text-[#d8c59b]/58">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-[1rem] border border-[#7e6330]/24 bg-[linear-gradient(180deg,rgba(25,25,25,0.9),rgba(11,11,11,0.96))] px-7 py-4 text-lg text-[#f6dfaa] shadow-[inset_0_1px_0_rgba(255,241,210,0.05)]"
                >
                  {chip}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#7e6330]/24 bg-[linear-gradient(180deg,rgba(17,17,17,0.96),rgba(8,8,8,0.94))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur md:p-8 lg:p-10">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.34em] text-[#d3b56f]/62">
                AlphaLedger Access
              </p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-[#fff2d0]">
                {formTitle}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-[#d5c6a3]/54">
                {formDescription}
              </p>
            </div>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
