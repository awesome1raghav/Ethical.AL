"use client";

import React from "react";
import AppLayout from "@/components/layout/AppLayout";

/**
 * @fileOverview Nexus Route Layout.
 * Now proxies to the shared AppLayout architecture.
 */
export default function NexusLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
