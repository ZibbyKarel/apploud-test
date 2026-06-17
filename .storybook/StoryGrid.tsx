import React from "react";

/** Vertical stack of labelled cases — the layout used by every "Overview" story. */
export function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      {children}
    </div>
  );
}

/** One labelled state inside an {@link Grid}. */
export function Case({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-start",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#8b949e",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
