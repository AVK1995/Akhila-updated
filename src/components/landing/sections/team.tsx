"use client";

import Image from "next/image";
import { Reveal } from "../shared-client";
import { ImagePlaceholder } from "../shared-static";

function PersonCard({
  name,
  heading,
  credential,
  bio,
  stats,
  imageSrc,
  imageHint,
  reversed = false,
}: {
  name: string;
  heading: string;
  credential: string;
  bio: string;
  stats: string[];
  imageSrc?: string;
  imageHint?: string;
  reversed?: boolean;
}) {
  return (
    <div className={`grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <Reveal>
        <div className="relative">
          <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-wine-50/60 to-gold-50/60 blur-2xl" />
          {imageSrc ? (
            <div className="group/portrait relative aspect-[4/3] w-full transform-gpu overflow-hidden rounded-3xl bg-cream-100 shadow-premium-lg ring-1 ring-inset ring-white/40 transition-all duration-700 ease-smooth [backface-visibility:hidden] hover:shadow-premium-xl hover:ring-gold-200/70">
              {/* Portrait */}
              <Image
                src={imageSrc}
                alt={`Portrait of ${name}`}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center transition-transform duration-[1200ms] ease-smooth group-hover/portrait:scale-[1.06]"
              />

              {/* Soft wine-tinted vignette — always slightly visible, deepens on hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/60 via-ink-900/10 to-transparent opacity-70 transition-opacity duration-700 ease-smooth group-hover/portrait:opacity-100"
              />

              {/* Subtle animated gold sheen on hover — premium niche feel */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-700 ease-smooth group-hover/portrait:opacity-100"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(193,150,50,0.18), rgba(115,42,61,0.18), rgba(193,150,50,0.18))",
                  mixBlendMode: "screen",
                }}
              />

              {/* Top-right gold sparkle — rotates in on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-5 top-5 text-[18px] leading-none text-gold-300 opacity-0 transition-all duration-500 ease-smooth group-hover/portrait:rotate-12 group-hover/portrait:opacity-100"
              >
                ✦
              </span>

              {/* Identity caption — slides up + fades in on hover */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 opacity-0 transition-all duration-500 ease-smooth group-hover/portrait:translate-y-0 group-hover/portrait:opacity-100">
                <div className="px-5 pb-5 pt-14 sm:px-6 sm:pb-6">
                  <p className="font-display text-[16px] font-medium leading-tight text-cream-50 sm:text-[18px]">
                    {name}
                  </p>
                  <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold-200 sm:text-[11.5px]">
                    {credential.split(" · ")[0]}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ImagePlaceholder
              ratio="4/3"
              rounded="3xl"
              label={`Portrait · ${name}`}
              hint={imageHint}
              className="shadow-premium-lg"
            />
          )}
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700 sm:text-xs">{name}</p>
          <h3 className="mt-3 font-display text-2xl font-medium leading-[1.12] text-ink-800 sm:text-[28px]">{heading}</h3>
          <p className="mt-4 text-[13px] font-medium uppercase tracking-[0.06em] text-wine-700 sm:text-sm">{credential}</p>
          <p className="body-prose mt-5">{bio}</p>
          <div className="mt-6 flex flex-wrap gap-x-3 gap-y-2">
            {stats.map((stat) => (
              <span key={stat} className="inline-flex items-center rounded-full border border-ink-100 bg-white px-3 py-1.5 text-[11px] font-medium text-ink-600 shadow-premium-sm sm:text-[12px]">
                {stat}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export function TeamSection() {
  const supportTeam = [
    { name: "Metabolic Specialist", role: "Lab Review and Markers", body: "Reviews your fasting insulin, HOMA-IR, inflammatory markers, and hormonal panels before any protocol is finalised." },
    { name: "IV Protocol Physician", role: "Infusion Formulation", body: "Designs your IV formulation based on your inflammatory load, insulin resistance severity, and gut status." },
    { name: "Clinical Support", role: "Weekly Check-ins & Monitoring", body: "Conducts your weekly check-ins, tracks your markers, and flags changes to Dr. Aditya and Akhila for real-time adjustments." },
  ];
  return (
    <section id="team" className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">The Clinical Team Behind The Programme</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              Meet the team <span className="italic text-wine-700">behind the method.</span>
            </h2>
            <div className="section-divider mt-6" />
          </div>
        </Reveal>

        <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-24 lg:space-y-28">
          <PersonCard
            name="Dr. Aditya"
            heading="The physician behind the method."
            credential="Senior Family Physician · 15 Years · 30,000+ Patients"
            bio="Dr. Aditya is a family physician, not a gynaecologist. In 15 years and over 30,000 consultations, he has never done a five-minute appointment. He looks at your sleep, your stress, your metabolic markers, and your full history together, not one part at a time. When PCOS is involved, the pattern is almost always metabolic. And almost always missed by the time a woman reaches us."
            stats={["15 Yrs Experience", "30,000+ Patients", "30 Min Minimum", "0 Five-Minute Appointments"]}
            imageSrc="/images/team/Dr%20Aditya.jpeg"
          />
          <PersonCard
            name="Akhila"
            heading="The nutritionist behind the results."
            credential="Clinical Nutritionist · Metabolic Nutrition · Gut-Hormone Axis"
            bio="Akhila handles the nutrition architecture of this programme. Every plan is built after your assessment, not before it. Her focus is blood sugar stabilisation, the gut-skin axis, and the gut-stress axis. These are the three nutritional levers that directly drive hormonal rhythm in PCOS. The goal is food that works with your body and actually holds over time."
            stats={["Gut-Skin Axis Protocol", "4-Week Update Cycle", "2× / Month Direct Sessions", "90 Days"]}
            imageSrc="/images/team/Akhila.jpeg"
            reversed
          />
        </div>

        <div className="mt-24 sm:mt-28">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700 sm:text-xs">
                The Clinical Support Team
              </p>
              <h3 className="mt-3 font-display text-xl font-medium text-ink-800 sm:text-2xl">
                The team working behind the scenes.
              </h3>
              <p className="body-prose mt-4">
                Dr. Aditya and Akhila are supported by a dedicated clinical team
                who review your assessments, validate your protocols, and ensure
                your progress is monitored every week.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:mt-14 sm:gap-6 lg:grid-cols-3">
            {supportTeam.map((m, i) => (
              <Reveal key={m.name} delay={i * 0.06}>
                <article className="group relative h-full overflow-hidden rounded-3xl border border-ink-100/80 bg-gradient-to-br from-white via-white to-cream-100/40 p-7 shadow-premium transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-gold-200/80 hover:shadow-premium-lg sm:p-8">
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-8 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent transition-transform duration-700 ease-smooth group-hover:scale-x-100"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-wine-100/0 blur-[60px] transition-colors duration-700 group-hover:bg-wine-100/60"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-5 top-5 text-[14px] leading-none text-gold-300/70 transition-all duration-500 group-hover:rotate-12 group-hover:text-gold-500"
                  >
                    ✦
                  </span>

                  <div className="relative">
                    <span className="inline-flex items-center rounded-full border border-wine-200/80 bg-wine-50/80 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-wine-700 backdrop-blur-sm sm:text-[11.5px]">
                      {m.role}
                    </span>
                    <h4 className="mt-4 font-display text-lg font-medium leading-snug text-ink-800 sm:text-[1.2rem]">
                      {m.name}
                    </h4>
                    <p className="body-prose mt-3 text-[14px] sm:text-[15px]">{m.body}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
