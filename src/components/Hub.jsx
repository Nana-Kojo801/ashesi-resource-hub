import { Fragment, useState, useMemo, useEffect } from "react";
import { classes } from "../lib/classes";
import Fuse from "fuse.js";
import Icon from "./Icon";
import TrackNav from "./TrackNav";
import ResourceRow from "./ResourceRow";
import ContactRow from "./ContactRow";
import SearchBox from "./SearchBox";
import FlagButton from "./FlagButton";
import DataState, { Skeleton, DetailState } from "./DataState";
import { CATEGORY_ORDER, sortCategories } from "../lib/categories";
import {
  actionLabel,
  academicSlugs,
  categoryHref,
  detailHref,
  displayType,
  external,
  prioritize,
  starterSlugs,
} from "../lib/presentation";
/** @param {{mode?: string, resources?: import("../lib/types").Resource[], category?: string, resource?: import("../lib/types").Resource | null, navigate: (href: string) => void, loading?: boolean, error?: Error | null, retry?: () => void, resourceSlug?: string}} props */
export default function Hub({
  mode = "home",
  resources = [],
  category = "",
  resource = null,
  navigate,
  loading = false,
  error = null,
  retry,
  resourceSlug = "",
}) {
  const [query, setQueryState] = useState(
    () => new URLSearchParams(window.location.search).get("q") || "",
  );
  const [typeFilter, setTypeFilter] = useState("All resources");
  const [showAll, setShowAll] = useState(false);
  const search = useMemo(
    () =>
      new Fuse(resources, {
        keys: [
          { name: "aliases", weight: 0.5 },
          { name: "title", weight: 0.3 },
          { name: "description", weight: 0.2 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [resources],
  );
  const categories = sortCategories([
    ...new Set(loading || error ? CATEGORY_ORDER : resources.map((r) => r.category)),
  ]).filter((c) => c !== "Emergency");
  const searching =
    mode === "search" || (mode === "home" && query.trim().length > 0);
  const people = mode === "people";
  const current = mode === "detail" ? resource?.category || "" : category;
  // A verbatim student phrase should resolve to its intended resource. Use
  // fuzzy search when no title or alias is an exact match.
  const exactMatches = resources.filter((r) =>
    [r.title, ...r.aliases].some(
      (value) => value.toLowerCase() === query.trim().toLowerCase(),
    ),
  );
  const matched =
    query.trim().length >= 2
      ? exactMatches.length
        ? exactMatches
        : search.search(query.trim()).map((r) => r.item)
      : [];
  const categoryResources = prioritize(
    resources.filter((r) => r.category === category),
    category === CATEGORY_ORDER[0] ? academicSlugs : [],
  );
  const filtered = (
    query.trim().length >= 2
      ? matched.filter((r) => r.category === category)
      : categoryResources
  ).filter(
    (r) =>
      typeFilter === "All resources" ||
      displayType(r) === (typeFilter === "Portals" ? "Portal" : "Form"),
  );
  const contacts = prioritize(
    (query.trim().length >= 2 ? matched : resources).filter(
      (r) => r.category === "Offices & People",
    ),
    ["academic-registry", "information-technology", "finance"],
  );
  const start = starterSlugs
    .map((slug) => resources.find((r) => r.slug === slug))
    .filter(Boolean);
  const hotline = resources.find((r) => r.slug === "academic-affairs-hotline");
  const host = resource
    ? resource.url
        .replace(/^mailto:|^tel:/, "")
        .replace(/^https?:\/\//, "")
        .split("/")[0]
    : "";
  const resourceAction = resource
    ? resource.type === "Form"
      ? "Open form"
      : actionLabel(resource.url) === "Open"
        ? "Open resource"
        : actionLabel(resource.url)
    : "";
  const quickLinks = [
    ["student-portal-camu-services", "CAMU", "Student portal and services"],
    ["canvas-lms", "Canvas", "Courses and learning"],
    ["meal-plan-subscriber-portal", "Meal plan", "Dining and meal balances"],
    ["webprint", "WebPrint", "Print, scan and top up"],
  ];
  const emergency = [
    ["emergency-security-incident", "Security incident", "Ashesi Security"],
    [
      "emergency-medical-emergency",
      "Medical emergency",
      "Natembea Health Center",
    ],
    [
      "emergency-sexual-misconduct",
      "Sexual misconduct",
      "First response & reporting support",
    ],
    [
      "emergency-general-support",
      "General support",
      "Ashesi general support line",
    ],
  ];
  function number(url) {
    return url
      .replace("tel:", "")
      .replace(/^(\+233)(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  }
  function setQuery(value) {
    setQueryState(value);
    setShowAll(false);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    history.replaceState(history.state, "", url);
  }
  useEffect(() => {
    if (mode === "search") document.getElementById("resource-search")?.focus();
  }, [mode]);
  return (
    <>
      <a href={"#main"} className={classes("skip-link", {})}>
        {"Skip to content"}
      </a>
      <header className={classes("site-header", {})}>
        <a
          href={"/"}
          aria-label={"Ashesi Resource Hub home"}
          className={classes("brand", {})}
        >
          <span
            aria-hidden={"true"}
            className={classes("brand-mark", {})}
          ></span>
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
      <div
        className={classes("app-layout", {
          "full-width": mode === "emergency",
          "directory-layout": people,
        })}
      >
        {mode !== "emergency" ? (
          <>
            <TrackNav
              categories={categories}
              current={current}
              people={people}
              report={mode === "report"}
              resource={resource}
              resourceSlug={resourceSlug}
              loading={loading}
              searching={searching}
            ></TrackNav>
          </>
        ) : null}
        <main
          id={"main"}
          className={classes("page-content", {
            "home-page": mode === "home" && !searching,
            "category-page": mode === "category",
            "search-page": searching,
            "people-page": people,
            "detail-page": mode === "detail",
            "report-page": mode === "report",
            "emergency-page": mode === "emergency",
          })}
        >
          {mode === "missing" ? (
            <><h1>Resource not found</h1><p className="subtitle">This resource may have been retired.</p><a className="outline-button" href="/">Browse resources</a></>
          ) : mode === "emergency" ? (
            <>
              <a href={"/"} className={classes("back-link mobile-only", {})}>
                <Icon name={"back"} size={18}></Icon>
                {"Resources"}
              </a>
              <div className={classes("emergency-heading", {})}>
                <h1>{"Urgent help"}</h1>
                <p className={classes("subtitle", {})}>
                  {"Campus emergency contacts, ready to call."}
                </p>
              </div>
              <div aria-busy={loading} className={classes("emergency-directory", {})}>
                {error && <DataState error={error} retry={retry} />}
                {emergency.map(([slug, label, provider], _index0) => (
                  <Fragment key={_index0}>
                    {(() => {
                      const entry = resources.find((r) => r.slug === slug);
                      return (
                        <>
                          {entry ? (
                            <>
                              <article className={classes("emergency-row", {})}>
                                <div
                                  className={classes("emergency-content", {})}
                                >
                                  <div>
                                    <h2>{label}</h2>
                                    <p>{provider}</p>
                                  </div>
                                  <a
                                    href={entry.url}
                                    className={classes("phone-number", {})}
                                  >
                                    {number(entry.url)}
                                  </a>
                                </div>
                                <div
                                  className={classes(
                                    "action-dock emergency-action",
                                    {},
                                  )}
                                >
                                  <a
                                    href={entry.url}
                                    className={classes("primary-button", {})}
                                  >
                                    {"Call now"}
                                    <span className={classes("sr-only", {})}>
                                      {": "}
                                      {provider}
                                    </span>
                                  </a>
                                </div>
                              </article>
                            </>
                          ) : loading ? <article className="emergency-row"><div className="emergency-content"><div><h2>{label}</h2><p>{provider}</p></div><Skeleton width="180px" /></div><div className="action-dock emergency-action"><Skeleton className="skeleton-button" /></div></article> : null}
                        </>
                      );
                    })()}
                  </Fragment>
                ))}
                {loading && <article className="emergency-row hotline-row"><div className="emergency-content"><div><h2>Academic Affairs Hotline</h2><p>Urgent academic assistance</p></div><Skeleton width="180px" /></div><div className="action-dock emergency-action"><Skeleton className="skeleton-button" /></div></article>}
                {hotline ? (
                  <>
                    <article
                      className={classes("emergency-row hotline-row", {})}
                    >
                      <div className={classes("emergency-content", {})}>
                        <div>
                          <h2>{"Academic Affairs Hotline"}</h2>
                          <p>{"Urgent academic assistance"}</p>
                        </div>
                        <a
                          href={hotline.url}
                          className={classes("phone-number", {})}
                        >
                          {hotline.url.replace("mailto:", "")}
                        </a>
                      </div>
                      <div
                        className={classes("action-dock emergency-action", {})}
                      >
                        <a
                          href={hotline.url}
                          className={classes("primary-button", {})}
                        >
                          {"Email hotline"}
                        </a>
                      </div>
                    </article>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {mode === "report" ? (
                <>
                  <a
                    href={`/resource/${resourceSlug}`}
                    className={classes("back-link mobile-only", {})}
                  >
                    <Icon name={"back"} size={18}></Icon>
                    {"Back to resource"}
                  </a>
                  <h1>{"Flag a problem"}</h1>
                  <p className="subtitle">{loading ? <Skeleton width="65%" /> : resource?.title}</p>
                  {error && <DataState error={error} retry={retry} />}
                  <FlagButton
                    resourceSlug={resourceSlug}
                    unavailable={loading || !!error}
                  ></FlagButton>
                </>
              ) : (
                <>
                  {mode === "detail" ? (
                    loading || error ? <><a href="/" className="back-link">Back to resources</a><DetailState error={error} retry={retry} /></> : <>
                      <div className={classes("breadcrumb", {})}>
                        <a href={"/"}>{"Resources"}</a>
                        <span>{"/"}</span>
                        <a href={categoryHref(resource.category)}>
                          {resource.category}
                        </a>
                      </div>
                      <a
                        href={categoryHref(resource.category)}
                        className={classes("back-link", {})}
                      >
                        <Icon name={"back"} size={20}></Icon>
                        {"Back to "}
                        {resource.category}
                      </a>
                      <h1>{resource.title}</h1>
                      <p className={classes("subtitle detail-description", {})}>
                        {resource.description}
                      </p>
                      <div className={classes("detail-record", {})}>
                        <dl className={classes("detail-metadata", {})}>
                          <div>
                            <dt>{"Type"}</dt>
                            <dd>{resource.type}</dd>
                          </div>
                          <div>
                            <dt>{"Access"}</dt>
                            <dd>{resource.access}</dd>
                          </div>
                          <div>
                            <dt>{"Destination"}</dt>
                            <dd>
                              <a
                                href={resource.url}
                                target={
                                  external(resource.url) ? "_blank" : undefined
                                }
                                rel={
                                  external(resource.url)
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                              >
                                {host}
                                <Icon name={"external"} size={16}></Icon>
                              </a>
                            </dd>
                          </div>
                          <div>
                            <dt>{"Verification date"}</dt>
                            <dd>{"19 Sep 2026"}</dd>
                          </div>
                        </dl>
                        <div
                          className={classes("action-dock detail-action", {})}
                        >
                          <a
                            href={resource.url}
                            target={
                              external(resource.url) ? "_blank" : undefined
                            }
                            rel={
                              external(resource.url)
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className={classes("primary-button", {})}
                          >
                            {resourceAction}
                            <Icon name={"external"} size={18}></Icon>
                          </a>
                          {external(resource.url) ? (
                            <>
                              <p>
                                {host === "forms.office.com"
                                  ? "Opens Microsoft Forms"
                                  : "Opens the resource"}
                                {" in a new tab. "}
                              </p>
                            </>
                          ) : null}
                        </div>
                      </div>
                      {resource.aliases.length ? (
                        <>
                          <section className={classes("aliases", {})}>
                            <h2>{"Students also call it"}</h2>
                            <ul>
                              {resource.aliases
                                .slice(0, 5)
                                .map((alias, _index1) => (
                                  <Fragment key={_index1}>
                                    <li>{alias}</li>
                                  </Fragment>
                                ))}
                            </ul>
                          </section>
                        </>
                      ) : null}
                      <div className={classes("flag-prompt", {})}>
                        <span>{"Something wrong with this link?"}</span>
                        <a
                          href={`${detailHref(resource)}/report`}
                          className={classes("outline-button", {})}
                        >
                          {"Flag a problem"}
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      {people ? (
                        <>
                          <h1>{"Who can help?"}</h1>
                          <p className={classes("subtitle", {})}>
                            {"Find the right office and contact them directly."}
                          </p>
                          <SearchBox
                            query={query}
                            placeholder={"Search offices or services…"}
                            showIcon={true}
                            onQuery={(e) => setQuery(e.detail)}
                          ></SearchBox>
                          <div
                            aria-live={"polite"}
                            aria-busy={loading} className={classes("contact-list", {})}
                          >
                            {loading || error ? <DataState kind="contact" count={3} error={error} retry={retry} /> : <>
                            {contacts
                              .slice(0, showAll || query ? undefined : 3)
                              .map((contact, _index2) => (
                                <Fragment key={contact.slug}>
                                  <ContactRow resource={contact}></ContactRow>
                                </Fragment>
                              ))}
                            {!contacts.length ? (
                              <>
                                <div className={classes("empty-state", {})}>
                                  <h2>{"No offices found"}</h2>
                                  <p>{"Try a different name or service."}</p>
                                  <button onClick={() => setQuery("")}>
                                    {"Clear search"}
                                  </button>
                                </div>
                              </>
                            ) : null}
                            </>}
                          </div>
                          {!showAll && !query && contacts.length > 3 ? (
                            <>
                              <button
                                onClick={() => setShowAll(true)}
                                className={classes(
                                  "more-resources directory-continuation",
                                  {},
                                )}
                              >
                                {"View all offices "}
                                <Icon name={"arrow"} size={18}></Icon>
                              </button>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {mode === "category" ? (
                            <>
                              <div className={classes("breadcrumb", {})}>
                                <a href={"/"}>{"Resources"}</a>
                                <span>{"/"}</span>
                                <span>{category}</span>
                              </div>
                              <h1>{category}</h1>
                              <p className={classes("subtitle", {})}>
                                {category === "Academic & Administration"
                                  ? "Portals, forms and services for your academic journey."
                                  : `Explore ${category.toLowerCase()} resources.`}
                              </p>
                              <div
                                className={classes(
                                  "category-select mobile-only",
                                  {},
                                )}
                              >
                                <select
                                  aria-label={"Browse resources"}
                                  value={categoryHref(category)}
                                  onChange={(e) =>
                                    navigate(e.currentTarget.value)
                                  }
                                >
                                  <option value={"/"}>{"All resources"}</option>
                                  {categories.map((name, _index3) => (
                                    <Fragment key={_index3}>
                                      <option value={categoryHref(name)}>
                                        {name}
                                      </option>
                                    </Fragment>
                                  ))}
                                </select>
                                <Icon name={"chevron"} size={18}></Icon>
                              </div>
                              <SearchBox
                                query={query}
                                placeholder={"Search this category…"}
                                onQuery={(e) => setQuery(e.detail)}
                              ></SearchBox>
                              <div
                                aria-label={"Filter by type"}
                                className={classes("filter-tabs", {})}
                              >
                                {["All resources", "Portals", "Forms"].map(
                                  (label, _index4) => (
                                    <Fragment key={_index4}>
                                      <button
                                        aria-pressed={typeFilter === label}
                                        onClick={() => {
                                          setTypeFilter(label);
                                          setShowAll(false);
                                        }}
                                        className={classes("", {
                                          active: typeFilter === label,
                                        })}
                                      >
                                        {label}
                                      </button>
                                    </Fragment>
                                  ),
                                )}
                              </div>
                              <div
                                aria-live={"polite"}
                                aria-busy={loading} className={classes("resource-list", {})}
                              >
                                {loading || error ? <DataState kind="resource" count={5} error={error} retry={retry} /> : <>
                                {filtered
                                  .slice(
                                    0,
                                    showAll ||
                                      query ||
                                      typeFilter !== "All resources"
                                      ? undefined
                                      : 5,
                                  )
                                  .map((entry, _index5) => (
                                    <Fragment key={entry.slug}>
                                      <ResourceRow
                                        resource={entry}
                                      ></ResourceRow>
                                    </Fragment>
                                  ))}
                                {!filtered.length ? (
                                  <>
                                    <div className={classes("empty-state", {})}>
                                      <h2>{"No matching resources"}</h2>
                                      <p>
                                        {
                                          "Try another phrase or choose a different resource type."
                                        }
                                      </p>
                                    </div>
                                  </>
                                ) : null}
                                </>}
                              </div>
                              {category === "Academic & Administration" ? (
                                <>
                                  <div
                                    className={classes("category-footer", {})}
                                  >
                                    {" Looking for a person? "}
                                    <a href={"/resource/academic-registry"}>
                                      {"View Academic Registry "}
                                      <Icon name={"arrow"} size={18}></Icon>
                                    </a>
                                  </div>
                                </>
                              ) : null}
                              {!showAll &&
                              !query &&
                              typeFilter === "All resources" &&
                              filtered.length > 5 ? (
                                <>
                                  <button
                                    onClick={() => setShowAll(true)}
                                    className={classes(
                                      "more-resources directory-continuation",
                                      {},
                                    )}
                                  >
                                    {"View all resources "}
                                    <Icon name={"arrow"} size={18}></Icon>
                                  </button>
                                </>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <h1>
                                {searching
                                  ? "Search resources"
                                  : "Where do you need to go?"}
                              </h1>
                              <p className={classes("subtitle", {})}>
                                {
                                  "Find a link, a form, or someone who can help."
                                }
                              </p>
                              <SearchBox
                                query={query}
                                placeholder={"Describe what you need…"}
                                onQuery={(e) => setQuery(e.detail)}
                              ></SearchBox>
                              {searching ? (
                                <>
                                  <section
                                    aria-live={"polite"}
                                    aria-busy={loading} className={classes("search-results", {})}
                                  >
                                    <h2
                                      className={classes("section-track", {})}
                                    >
                                      {"Results"}
                                    </h2>
                                    {loading || error ? <DataState kind="search" count={2} error={error} retry={retry} /> : <>
                                    <p className={classes("result-count", {})}>
                                      {matched.length}
                                      {matched.length === 1
                                        ? "result"
                                        : "results"}
                                    </p>
                                    {matched
                                      .slice(0, showAll ? undefined : 12)
                                      .map((entry, _index6) => (
                                        <Fragment key={entry.slug}>
                                          <article
                                            className={classes(
                                              "search-result",
                                              {},
                                            )}
                                          >
                                            <div
                                              className={classes(
                                                "search-result-content",
                                                {},
                                              )}
                                            >
                                              <h2>
                                                <a href={detailHref(entry)}>
                                                  {entry.title}
                                                </a>
                                              </h2>
                                              <p
                                                className={classes(
                                                  "result-category",
                                                  {},
                                                )}
                                              >
                                                {entry.category}
                                              </p>
                                              <p>{entry.description}</p>
                                              <div
                                                className={classes(
                                                  "result-metadata",
                                                  {},
                                                )}
                                              >
                                                {entry.type}
                                                <span>{"·"}</span>
                                                {entry.access}
                                              </div>
                                              {entry.aliases.length ? (
                                                <>
                                                  <div
                                                    className={classes(
                                                      "result-aliases",
                                                      {},
                                                    )}
                                                  >
                                                    <h3>{"Also called"}</h3>
                                                    <p>
                                                      {(entry.slug ===
                                                      "maintenance-service-request"
                                                        ? [
                                                            "my ac is broken",
                                                            "fix my room",
                                                            "hostel problem",
                                                          ]
                                                        : entry.aliases.slice(
                                                            0,
                                                            3,
                                                          )
                                                      ).join("　/　")}
                                                    </p>
                                                  </div>
                                                </>
                                              ) : null}
                                            </div>
                                            <div
                                              className={classes(
                                                "action-dock search-result-action",
                                                {},
                                              )}
                                            >
                                              <a
                                                href={entry.url}
                                                target={
                                                  external(entry.url)
                                                    ? "_blank"
                                                    : undefined
                                                }
                                                rel={
                                                  external(entry.url)
                                                    ? "noopener noreferrer"
                                                    : undefined
                                                }
                                                className={classes(
                                                  "primary-button",
                                                  {},
                                                )}
                                              >
                                                {entry.type === "Form"
                                                  ? "Open form"
                                                  : actionLabel(entry.url)}
                                                <Icon
                                                  name={"external"}
                                                  size={18}
                                                ></Icon>
                                              </a>
                                              <a
                                                href={detailHref(entry)}
                                                className={classes(
                                                  "text-link",
                                                  {},
                                                )}
                                              >
                                                {"View details "}
                                                <Icon
                                                  name={"arrow"}
                                                  size={18}
                                                ></Icon>
                                              </a>
                                            </div>
                                          </article>
                                        </Fragment>
                                      ))}
                                    {!matched.length ? (
                                      <>
                                        <div
                                          className={classes("empty-state", {})}
                                        >
                                          <h2>
                                            {query.trim().length < 2
                                              ? "What are you looking for?"
                                              : "No matches yet"}
                                          </h2>
                                          <p>
                                            {query.trim().length < 2
                                              ? "Enter at least two characters to search the directory."
                                              : "Try a different phrase, or browse a category below."}
                                          </p>
                                        </div>
                                      </>
                                    ) : null}
                                    {matched.length > 12 && !showAll ? (
                                      <>
                                        <button
                                          onClick={() => setShowAll(true)}
                                          className={classes(
                                            "more-resources",
                                            {},
                                          )}
                                        >
                                          {"Show all results"}
                                        </button>
                                      </>
                                    ) : null}
                                    </>}
                                  </section>
                                  <section
                                    className={classes("another-route", {})}
                                  >
                                    <h2>{"Try another route"}</h2>
                                    <p>
                                      {
                                        "Try another phrase or browse a category."
                                      }
                                    </p>
                                    <nav aria-label={"Alternative categories"}>
                                      <a
                                        href={categoryHref(
                                          "Support & Wellbeing",
                                        )}
                                      >
                                        <strong
                                          className={classes(
                                            "alternative-title",
                                            {},
                                          )}
                                        >
                                          {"Support & Wellbeing"}
                                        </strong>
                                        <span>
                                          {
                                            "Housing, facilities, health and personal support."
                                          }
                                        </span>
                                      </a>
                                      <a href={categoryHref("Housing")}>
                                        <strong
                                          className={classes(
                                            "alternative-title",
                                            {},
                                          )}
                                        >
                                          {"Housing"}
                                        </strong>
                                        <span>
                                          {
                                            "Residential life and accommodation."
                                          }
                                        </span>
                                      </a>
                                      <a
                                        href={categoryHref("Offices & People")}
                                      >
                                        <strong
                                          className={classes(
                                            "alternative-title",
                                            {},
                                          )}
                                        >
                                          {"Offices & People"}
                                        </strong>
                                        <span>
                                          {
                                            "Find the right office or person to contact."
                                          }
                                        </span>
                                      </a>
                                    </nav>
                                  </section>
                                </>
                              ) : (
                                <>
                                  <div className={classes("suggestions", {})}>
                                    <span>{"Try:"}</span>
                                    <div>
                                      <a href={"/?q=transcript"}>
                                        {"Get a transcript"}
                                      </a>
                                      <a href={"/?q=my%20AC%20is%20broken"}>
                                        {"Fix something in my room"}
                                      </a>
                                      <a href={"/?q=internship"}>
                                        {"Find an internship"}
                                      </a>
                                    </div>
                                  </div>
                                  <div
                                    className={classes(
                                      "mobile-browse mobile-only",
                                      {},
                                    )}
                                  >
                                    <label htmlFor={"category-picker"}>
                                      {"Browse resources"}
                                    </label>
                                    <div
                                      className={classes("category-select", {})}
                                    >
                                      <select
                                        id={"category-picker"}
                                        onChange={(e) =>
                                          navigate(e.currentTarget.value)
                                        }
                                      >
                                        <option value={"/"}>
                                          {"All resources"}
                                        </option>
                                        {categories.map((name, _index7) => (
                                          <Fragment key={_index7}>
                                            <option value={categoryHref(name)}>
                                              {name}
                                            </option>
                                          </Fragment>
                                        ))}
                                      </select>
                                      <Icon name={"chevron"} size={18}></Icon>
                                    </div>
                                  </div>
                                  <section className={classes("everyday", {})}>
                                    {error && <DataState error={error} retry={retry} />}
                                    <h2>{"Everyday links"}</h2>
                                    <div aria-busy={loading} className={classes("quick-links", {})}>
                                      {quickLinks.map(
                                        ([slug, title, desc], _index8) => (
                                          <Fragment key={_index8}>
                                            {(() => {
                                              const entry = resources.find(
                                                (r) => r.slug === slug,
                                              );
                                              return (
                                                <>
                                                  {entry ? (
                                                    <>
                                                      <a
                                                        href={entry.url}
                                                        target={"_blank"}
                                                        rel={
                                                          "noopener noreferrer"
                                                        }
                                                      >
                                                        <div>
                                                          <h3>{title}</h3>
                                                          <p>{desc}</p>
                                                        </div>
                                                        <Icon
                                                          name={"arrow"}
                                                          size={19}
                                                        ></Icon>
                                                      </a>
                                                    </>
                                                  ) : loading ? <div className="quick-link-pending"><div><h3>{title}</h3><p>{desc}</p></div><Skeleton width="24px" /></div> : null}
                                                </>
                                              );
                                            })()}
                                          </Fragment>
                                        ),
                                      )}
                                    </div>
                                  </section>
                                  <section
                                    className={classes("starter-section", {})}
                                  >
                                    <h2>{"Start here"}</h2>
                                    <div
                                      aria-busy={loading} className={classes("resource-list", {})}
                                    >
                                      {loading || error ? <DataState kind="resource" count={4} error={error} retry={retry} /> : <>
                                      {start.map((entry, _index9) => (
                                        <Fragment key={entry.slug}>
                                          <ResourceRow
                                            resource={entry}
                                            home={true}
                                          ></ResourceRow>
                                        </Fragment>
                                      ))}
                                      </>}
                                    </div>
                                  </section>
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
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
    </>
  );
}
