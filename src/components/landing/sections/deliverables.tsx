"use client";

import { Reveal } from "../shared-client";
import { StethoscopeIcon, FlaskIcon, DropletIcon, CalendarIcon } from "../icons";

export function DeliverablesSection() {
  const deliverables = [
    {
      n: "01",
      icon: StethoscopeIcon,
      title: "Physician Metabolic Consultation",
      value: "Deliverable Value · ₹15,000+",
      body: "Dr. Aditya spends a minimum of 30 minutes with you. He checks your sleep, your stress, your work history, and the markers that actually explain your PCOS: fasting insulin, HOMA-IR, cortisol, and inflammatory load. This is where your root cause gets a name.",
    },
    {
      n: "02",
      icon: FlaskIcon,
      title: "Personalised Metabolic Nutrition Plan",
      value: "Deliverable Value · ₹12,000+",
      body: "Akhila builds your nutrition plan after understanding your blood sugar response, your gut health, and your daily rhythm. Not a template. Not a low-carb PDF. A plan updated every four weeks based on how your body is actually responding, with two direct sessions with Akhila every month.",
    },
    {
      n: "03",
      icon: DropletIcon,
      title: "Therapeutic IV Infusion Support",
      value: "Deliverable Value · ₹30,000+",
      body: "This is what separates us from every health coach and online PCOS programme you have seen. When your body is in chronic inflammation, oral supplements are only partially absorbed. IV infusions bypass your gut entirely. 100% of what goes in is used by your cells. Sleep improves first. Then energy. Then weight starts moving. Protocol is customised clinically for your case.",
    },
    {
      n: "04",
      icon: CalendarIcon,
      title: "Weekly Clinical Monitoring and Movement",
      value: "Deliverable Value · ₹8,000+",
      body: "Weekly check-ins with the clinical team who know your specific case. Your movement plan updated every week, 25 to 30-minute sessions, no gym required. Stress management and gut restoration protocols adjusted as your body responds. You are not in a broadcast group. You are in a structured clinical environment.",
    },
  ];
  return (
    <section id="what-you-get" className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">What This Actually Is</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              Not a consultation.{" "}
              <span className="text-gradient-wine">A diagnosis.</span>
            </h2>
            <div className="section-divider mt-6" />
            <p className="body-lede mt-6">
              It is not about what to eat or what to avoid. It is about
              understanding what is actually breaking down in your body and
              correcting it at the source. Every woman who comes to us gets a
              complete metabolic picture, not a five-minute prescription.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:mt-16 sm:gap-6 lg:grid-cols-2">
          {deliverables.map((d, i) => (
            <Reveal key={d.n} delay={i * 0.06}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-ink-100/80 bg-gradient-to-br from-white via-white to-cream-100/60 p-7 shadow-premium transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-gold-200/80 hover:shadow-premium-lg sm:p-8">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-8 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent transition-transform duration-700 ease-smooth group-hover:scale-x-100"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-6 right-2 select-none font-display text-[110px] font-medium leading-none text-gold-100/70 transition-all duration-700 group-hover:-translate-y-1 group-hover:text-gold-200/80 sm:right-4 sm:text-[140px]"
                >
                  {d.n}
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-wine-50/0 via-transparent to-gold-50/0 opacity-0 transition-opacity duration-700 group-hover:from-wine-50/40 group-hover:to-gold-50/30 group-hover:opacity-100"
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <span className="icon-disc icon-disc-wine h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                      <d.icon className="relative h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.6} />
                    </span>
                    <span className="rounded-full border border-gold-200/70 bg-gold-50/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-700 backdrop-blur-sm sm:text-[11px]">
                      {d.value}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-medium leading-snug text-ink-800 sm:text-[1.3rem]">
                    {d.title}
                  </h3>
                  <p className="body-prose mt-3">{d.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-12 text-center text-sm text-ink-400 sm:mt-14 sm:text-[15px]">
            Programme pricing is determined after your metabolic assessment,
            based on what your body actually needs.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
