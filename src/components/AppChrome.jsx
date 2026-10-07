import Icon from "./Icon";
import { classes } from "../lib/classes";

// These elements stay mounted when the route's content changes.
export function AppHeader({ mode, people }) {
  return <>
      <a href={"#main"} className={classes("skip-link", {})}>
        {"Skip to content"}
      </a>
      <header className={classes("site-header", {})}>
        <a
          href={"/"}
          aria-label={"Ashesi Resource Hub home"}
          className={classes("brand", {})}
        >
          <img src="/hub-mark.svg" className="brand-mark" width="32" height="36" alt="" />
          <span>{"Ashesi Resource Hub"}</span>
        </a>
        <nav
          aria-label={"Main navigation"}
          className={classes("desktop-nav", {})}
        >
          <a
            href={"/"}
            className={classes("", { active: !people && mode !== "emergency" })}
          >
            {"Resources"}
          </a>
          <a
            href={"/category/offices-and-people"}
            className={classes("", { active: people })}
          >
            {"People"}
          </a>
        </nav>
        <a
          href={"/emergency"}
          className={classes("emergency-link", {
            active: mode === "emergency",
          })}
        >
          {"Emergency"}
        </a>
      </header>
  </>;
}

export function BottomNav({ mode, people, searching }) {
  return <>
      {mode !== "emergency" && mode !== "report" ? (
        <>
          <nav
            aria-label={"Main navigation"}
            className={classes("mobile-nav", {})}
          >
            <a
              href={"/"}
              className={classes("", { active: !people && !searching })}
            >
              <Icon name={"resource"} size={23}></Icon>
              <span>{"Resources"}</span>
            </a>
            <a href={"/search"} className={classes("", { active: searching })}>
              <Icon name={"search"} size={24}></Icon>
              <span>{"Search"}</span>
            </a>
            <a
              href={"/category/offices-and-people"}
              className={classes("", { active: people })}
            >
              <Icon name={"people"} size={24}></Icon>
              <span>{"People"}</span>
            </a>
          </nav>
        </>
      ) : null}
  </>;
}
