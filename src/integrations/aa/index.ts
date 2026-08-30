import { env, isAAConfigured } from "../../env";
import { AAProvider } from "./types";
import { SetuAAProvider } from "./setuProvider";
import { MockAAProvider } from "./mockProvider";

let provider: AAProvider | null = null;

export function getAAProvider(): AAProvider {
  if (!provider) {
    provider = env.aa.provider === "setu" && isAAConfigured ? new SetuAAProvider() : new MockAAProvider();
  }
  return provider;
}

export * from "./types";
