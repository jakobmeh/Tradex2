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
      className="h-[180px] w-[540px] object-contain sm:h-[198px] sm:w-[600px] lg:h-[230px] lg:w-[760px]"
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
        <Image
          src="/background.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-[0.1] mix-blend-screen"
        />
        <div className="absolute inset-x-0 top-0 h-[240px] bg-[linear-gradient(180deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.92)_58%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_58%)]" />
        <div className="absolute -left-[20rem] top-[4rem] h-[40rem] w-[40rem] rounded-full border border-white/5 bg-[radial-gradient(circle_at_38%_40%,rgba(214,163,73,0.11),rgba(95,67,24,0.08)_24%,rgba(12,12,12,0.44)_52%,transparent_74%)] shadow-[0_0_90px_rgba(115,82,24,0.12)] sm:-left-[23rem] sm:h-[48rem] sm:w-[48rem] lg:-left-[18rem] lg:h-[50rem] lg:w-[50rem]" />
        <div className="absolute -left-[11rem] top-[12rem] h-[24rem] w-[24rem] rounded-full border border-white/4 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.035),rgba(179,132,49,0.05)_18%,rgba(10,10,10,0.02)_58%,transparent_76%)] sm:-left-[13rem] sm:h-[28rem] sm:w-[28rem] lg:-left-[8rem] lg:h-[30rem] lg:w-[30rem]" />
        <div className="absolute left-[1rem] top-[26rem] h-[10rem] w-[10rem] rounded-full bg-[radial-gradient(circle,rgba(198,147,58,0.08)_0%,rgba(88,61,18,0.03)_38%,transparent_68%)] blur-3xl sm:left-[2rem] sm:h-[12rem] sm:w-[12rem] lg:left-[4rem] lg:h-[14rem] lg:w-[14rem]" />
        <div className="absolute inset-y-0 left-0 w-[38%] bg-[linear-gradient(90deg,rgba(0,0,0,0.34),rgba(0,0,0,0.08)_52%,transparent)]" />
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
              <h1 className="mt-7 max-w-[12ch] text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-[#fff5db] lg:text-[4.1rem]">
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
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-[#fff2d0]">
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
