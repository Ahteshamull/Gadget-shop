import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/all-stocks")({
  beforeLoad: () => {
    throw redirect({ to: "/gadget" });
  },
  component: () => null,
});
