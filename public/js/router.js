/**
 * Client-side Hash Router — Multi-Page App Experience
 * Juilliard Academy Interhouse Sports Day
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.params = {};
    this.routeChangeCallbacks = [];

    window.addEventListener("hashchange", () => this.handleRoute());
  }

  register(pattern, handler) {
    this.routes[pattern] = handler;
  }

  onRouteChange(callback) {
    this.routeChangeCallbacks.push(callback);
  }

  navigate(path) {
    window.location.hash = path.startsWith("#") ? path : `#${path}`;
  }

  back() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.navigate("#/table");
    }
  }

  handleRoute() {
    const rawHash = window.location.hash || "#/table";
    const cleanHash = rawHash.replace(/^#/, "") || "/table";
    const [path, queryString] = cleanHash.split("?");

    let matchedRoute = null;
    let matchedParams = {};

    for (const pattern in this.routes) {
      const paramNames = [];
      const regexPattern = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        paramNames.push(key);
        return "([^/]+)";
      });
      const regex = new RegExp(`^${regexPattern}$`);
      const match = path.match(regex);

      if (match) {
        matchedRoute = pattern;
        paramNames.forEach((name, idx) => {
          matchedParams[name] = decodeURIComponent(match[idx + 1]);
        });
        break;
      }
    }

    if (!matchedRoute) {
      // Fallback route
      matchedRoute = "/table";
      matchedParams = {};
    }

    this.currentRoute = matchedRoute;
    this.params = matchedParams;

    // Execute route handler
    const handler = this.routes[matchedRoute];
    if (typeof handler === "function") {
      handler(matchedParams);
    }

    // Notify listeners (e.g. for active bottom nav highlighting)
    this.routeChangeCallbacks.forEach(cb => {
      try {
        cb({ route: matchedRoute, path, params: matchedParams });
      } catch (e) {
        console.error("Route change callback error:", e);
      }
    });

    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  init() {
    this.handleRoute();
  }
}

export const router = new Router();
