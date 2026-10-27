"use client";

import { useSearchParams } from "next/navigation";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import * as A from "./variant-a";
import * as B from "./variant-b";
import * as C from "./variant-c";

const variants = [
  { key: "A", name: A.name, Component: A.VariantA },
  { key: "B", name: B.name, Component: B.VariantB },
  { key: "C", name: C.name, Component: C.VariantC },
];

export function StyleTile() {
  const current = useSearchParams().get("variant") ?? "A";
  const { Component } = variants.find((v) => v.key === current) ?? variants[0];
  return (
    <>
      <Component />
      <PrototypeSwitcher variants={variants} current={current} />
    </>
  );
}
