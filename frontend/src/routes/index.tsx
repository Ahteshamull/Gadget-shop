import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppSelector } from "../store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PhoneTrack" },
      { name: "description", content: "PhoneTrack retail & IMEI tracking system" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    navigate({ to: isAuthenticated ? "/dashboard" : "/login", replace: true });
  }, [isAuthenticated, navigate]);

  return null;
}
