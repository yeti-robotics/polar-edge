import { init, track } from "@plausible-analytics/tracker";

init({
  domain: "scout.yetirobotics.org",
  endpoint: "https://analytics.polaredge.dev/api/event",
  autoCapturePageviews: false,
});

track("pageview", {});

export function onRouterTransitionStart(url: string) {
  track("pageview", { url: new URL(url, window.location.href).href });
}
