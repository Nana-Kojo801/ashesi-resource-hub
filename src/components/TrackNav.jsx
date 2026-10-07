import { Fragment, useState, useMemo, useEffect } from "react";
import { classes } from "../lib/classes";
import Icon from "./Icon";
import { Skeleton } from "./DataState";
import { categoryHref } from "../lib/presentation";
export default function TrackNav({
  categories = [],
  current = "",
  people = false,
  report = false,
  resource = null,
  searching = false,
  resourceSlug = "",
  loading = false,
}) {
  return (
    <>
      <aside className={classes("sidebar", {})}>
        <h2>
          {report ? "Resource" : people ? "Directory" : "Browse resources"}
        </h2>
        <nav
          aria-label={
            people
              ? "Directory"
              : report
                ? "Resource navigation"
                : "Browse resources"
          }
          className={classes("track-nav", {})}
        >
          {report ? (
            <>
              <a href={`/resource/${resourceSlug}`}>
                {resource?.slug === "maintenance-service-request"
                  ? "Maintenance request"
                  : loading ? <Skeleton width="80%" /> : resource?.title || "Back to resource"}
              </a>
              <a
                aria-current={"page"}
                href={`/resource/${resourceSlug}/report`}
                className={classes("selected", {})}
              >
                {"Report a problem"}
              </a>
            </>
          ) : (
            <>
              {people ? (
                <>
                  <a
                    aria-current={"page"}
                    href={"/category/offices-and-people"}
                    className={classes("selected", {})}
                  >
                    {"All offices"}
                  </a>
                </>
              ) : (
                <>
                  <a
                    aria-current={!current ? "page" : undefined}
                    href={searching ? "/search" : "/"}
                    className={classes("", { selected: !current })}
                  >
                    {searching ? "Search" : "All resources"}
                  </a>
                  {categories.map((name, _index0) => (
                    <Fragment key={_index0}>
                      <a
                        aria-current={current === name ? "page" : undefined}
                        href={categoryHref(name)}
                        className={classes("", { selected: current === name })}
                      >
                        {name}
                      </a>
                    </Fragment>
                  ))}
                </>
              )}
            </>
          )}
        </nav>
        {!report ? (
          <>
            <div className={classes("sidebar-foot", {})}>
              {people ? (
                <>
                  <p>{"Need urgent help?"}</p>
                  <a href={"/emergency"}>
                    {"Go to Emergency "}
                    <Icon name={"arrow"} size={18}></Icon>
                  </a>
                </>
              ) : (
                <>
                  <em>{"No account needed."}</em>
                </>
              )}
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}
