"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

/** Stable hooks for tests to locate this component's parts. */
export enum SplashScreenDataTestIds {
  Root = "splash-screen",
  Logo = "splash-screen-logo",
  Name = "splash-screen-name",
  Tagline = "splash-screen-tagline",
}

export function SplashScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGPathElement>(null);
  const letterRef = useRef<SVGPathElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      gsap.set(ringRef.current, {
        scale: 0.25,
        rotation: -200,
        opacity: 0,
        transformOrigin: "50% 50%",
      });
      gsap.set(letterRef.current, {
        scale: 0.4,
        opacity: 0,
        transformOrigin: "50% 50%",
      });
      gsap.set(".sp-glow", { opacity: 0, scale: 0.3 });
      gsap.set(".sp-glow-inner", { opacity: 0, scale: 0.1 });
      gsap.set([".sp-name", ".sp-tagline"], { y: 24, opacity: 0 });
      gsap.set(".sp-divider", { scaleX: 0, opacity: 0, transformOrigin: "50% 50%" });

      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem("splash-shown", "1");
          setDone(true);
        },
      });

      tl
        // Outer glow blooms
        .to(".sp-glow", { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" }, 0)
        // Ring spins and expands in
        .to(
          ringRef.current,
          { scale: 1, rotation: 0, opacity: 1, duration: 0.85, ease: "power3.out" },
          0.08,
        )
        // Inner glow catches up
        .to(".sp-glow-inner", { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }, 0.5)
        // Letter materialises from centre
        .to(
          letterRef.current,
          { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2.2)" },
          0.52,
        )
        // Assembly pop
        .to(".sp-logo", { scale: 1.12, duration: 0.17, ease: "power2.out" }, 1.0)
        .to(".sp-logo", { scale: 1, duration: 0.72, ease: "elastic.out(1.05, 0.36)" }, 1.17)
        // Glow flares on pop then settles
        .to(".sp-glow", { opacity: 0.4, scale: 1.28, duration: 0.17 }, 1.0)
        .to(".sp-glow", { opacity: 1, scale: 1, duration: 0.6, ease: "power2.in" }, 1.17)
        .to(".sp-glow-inner", { opacity: 0.5, scale: 1.3, duration: 0.17 }, 1.0)
        .to(".sp-glow-inner", { opacity: 1, scale: 1, duration: 0.55, ease: "power2.in" }, 1.17)
        // Text reveals
        .to(".sp-name", { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, 1.2)
        .to(
          ".sp-divider",
          { scaleX: 1, opacity: 1, duration: 0.5, ease: "power3.out" },
          1.42,
        )
        .to(".sp-tagline", { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 1.52)
        // Gentle heartbeat while holding
        .to(".sp-glow", { opacity: 0.55, scale: 1.06, duration: 0.7, ease: "sine.inOut" }, 2.1)
        .to(".sp-glow", { opacity: 1, scale: 1, duration: 0.7, ease: "sine.inOut" }, 2.8)
        // Hold
        .to({}, { duration: 0.35 })
        // Exit — whole screen slides up
        .to(containerRef.current, {
          y: "-105vh",
          duration: 0.74,
          ease: "power3.inOut",
        });
    },
    { scope: containerRef, dependencies: [] },
  );

  if (done) return null;

  return (
    <div
      ref={containerRef}
      data-testid={SplashScreenDataTestIds.Root}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ backgroundColor: "#07111e" }}
    >
      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
      />

      {/* Outer ambient glow */}
      <div
        className="sp-glow pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 48% at 50% 44%, rgba(32,110,255,0.18) 0%, rgba(16,60,180,0.07) 52%, transparent 72%)",
        }}
      />

      {/* Inner tight glow (behind logo) */}
      <div
        className="sp-glow-inner pointer-events-none absolute"
        style={{
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(60,140,255,0.28) 0%, rgba(30,80,220,0.12) 50%, transparent 75%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
        }}
      />

      {/* Logo */}
      <div
        className="sp-logo relative"
        data-testid={SplashScreenDataTestIds.Logo}
        style={{ overflow: "visible" }}
      >
        <svg
          viewBox="0 0 77.57 77.57"
          width="192"
          height="192"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
          style={{
            overflow: "visible",
            filter:
              "drop-shadow(0 0 28px rgba(50,130,255,0.6)) drop-shadow(0 6px 22px rgba(0,0,0,0.9))",
          }}
        >
          {/* Circular ring — spins in */}
          <path
            ref={ringRef}
            d="M78,39.05a38.78,38.78,0,1,0,38.79,38.78A38.83,38.83,0,0,0,78,39.05Zm0,71.31a32.53,32.53,0,1,1,32.53-32.53A32.56,32.56,0,0,1,78,110.36Z"
            transform="translate(-39.17 -39.05)"
            fill="#ffffff"
          />
          {/* Apploud letter mark — materialises from centre */}
          <path
            ref={letterRef}
            d="M85.67,63.68H79.34a2,2,0,0,0-2.17,2.21V67a2.07,2.07,0,0,0,2.14,2.21h0.51c3.73,0,5.09,0,5.58-.09v0c5.26,0,8.4,3.24,8.4,8.67s-3.06,8.75-8.41,8.75l-6.28,0L71.63,65.41a2.3,2.3,0,0,0-2.37-1.73H66.82a2.34,2.34,0,0,0-2.36,1.7L56,89.36a2,2,0,0,0,.15,1.89,2,2,0,0,0,1.72.75H59.6A2.31,2.31,0,0,0,62,90.23L68,71,74.1,90.27A2.32,2.32,0,0,0,76.48,92h9.19c8.9,0,14.42-5.44,14.42-14.2S94.57,63.68,85.67,63.68Z"
            transform="translate(-39.17 -39.05)"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Text block */}
      <div className="relative z-10 mt-10 flex flex-col items-center gap-3 text-center">
        <h1
          className="sp-name text-[2.1rem] font-bold tracking-tight"
          data-testid={SplashScreenDataTestIds.Name}
          style={{ color: "#e8edf5" }}
        >
          Apploud
        </h1>
        <div
          className="sp-divider h-px w-14 rounded-full"
          style={{ backgroundColor: "rgba(60,130,255,0.55)" }}
        />
        <p
          className="sp-tagline text-[0.74rem] uppercase"
          data-testid={SplashScreenDataTestIds.Tagline}
          style={{ color: "#6e87a4", letterSpacing: "0.16em" }}
        >
          GitLab Access Audit
        </p>
      </div>
    </div>
  );
}
