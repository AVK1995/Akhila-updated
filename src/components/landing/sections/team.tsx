"use client";

import Image from "next/image";
import { Reveal } from "../shared-client";
import { Pmos } from "../shared-static";

/* =============================================================================
 * OUR CLINICAL TEAM
 * =============================================================================
 * Two-column: paired portraits + the "why this pairing works" narrative.
 *
 * NOTE: the approved copy calls for ONE photo of Dr. Aditya and Akhila
 * together. That asset doesn't exist yet, so the two existing portraits are
 * shown as a pair. Drop a combined shot in /public/images/team/ and swap the
 * <PortraitPair/> below for a single <Image/> when it lands.
 * =============================================================================
 */

function PortraitPair() {
  const people = [
    { name: "Akhila", role: "Clinical Nutritionist", src: "/images/team/Akhila.jpeg" },
    { name: "Dr. Aditya", role: "Senior Family Physician", src: "/images/team/Dr%20Aditya.jpeg" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {people.map((p) => (
        <div
          key={p.name}
          className="group/portrait relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-cream-100 shadow-premium-lg ring-1 ring-inset ring-white/40"
        >
          <Image
            src={p.src}
            alt={`Portrait of ${p.name}, ${p.role}`}
            fill
            sizes="(min-width: 1024px) 25vw, 45vw"
            className="object-cover object-center transition-transform duration-[1200ms] ease-smooth group-hover/portrait:scale-[1.05]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 px-3 pb-3 sm:px-4 sm:pb-4">
            <p className="font-display text-[14px] font-medium leading-tight text-cream-50 sm:text-[16px]">
              {p.name}
            </p>
            <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gold-200 sm:text-[10.5px]">
              {p.role}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TeamSection() {
  return (
    <section id="team" className="relative scroll-mt-20 py-14 sm:py-20 lg:py-24">
      <div className="container-tight">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Our Clinical Team</span>
            <h2 className="display-headline text-display-lg sm:text-display-xl">
              Meet The Team Behind{" "}
              <span className="title-underline text-gradient-wine italic">Our Root Cause Approach</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid items-center gap-10 sm:mt-14 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <PortraitPair />
          </Reveal>

          <Reveal delay={0.08}>
            {/* Centred on mobile, left-aligned from lg where the copy sits in
                its own column beside the portraits. */}
            <div className="space-y-5 text-center lg:text-left">
              <p className="body-prose">
                Dr. Aditya has spent more than{" "}
                <strong className="font-semibold text-ink-800">
                  15 years treating over 30,000 patients
                </strong>{" "}
                across a{" "}
                <strong className="font-semibold text-ink-800">
                  wide range of chronic health conditions
                </strong>
                . Through years of clinical practice, he noticed the same
                pattern repeatedly. Women with <Pmos /> were often receiving the
                same diagnosis, yet the underlying drivers were completely
                different.
              </p>

              <p className="body-prose">
                Akhila brings the{" "}
                <strong className="font-semibold text-ink-800">
                  functional nutrition perspective
                </strong>{" "}
                that helps bridge the{" "}
                <strong className="font-semibold text-ink-800">
                  gap between diagnosis and day-to-day recovery
                </strong>
                . Instead of generic meal plans, she builds nutrition and
                lifestyle strategies around each woman&rsquo;s metabolic health,
                symptoms and routine.
              </p>

              <div className="rounded-2xl border border-gold-200/70 bg-gradient-to-br from-gold-50/80 via-cream-50 to-wine-50/40 px-5 py-4 shadow-premium-sm sm:px-6 sm:py-5">
                <p className="text-[14.5px] leading-relaxed text-ink-700 sm:text-[15.5px]">
                  Together, they{" "}
                  <strong className="font-semibold text-ink-800">
                    combine medicine with functional nutrition
                  </strong>{" "}
                  to create{" "}
                  <strong className="font-semibold text-ink-800">
                    one personalised roadmap
                  </strong>{" "}
                  designed around the woman, not just the diagnosis.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
