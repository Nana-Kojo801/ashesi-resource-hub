import { Fragment, useState, useMemo, useEffect } from "react";
import { classes } from "../lib/classes";
import Icon from "./Icon";
import {
  detailHref,
  displayType,
  external,
  summary,
} from "../lib/presentation";
export default function ResourceRow({ resource, home = false }) {
  const type =
    home && resource.slug === "writing-center"
      ? "Resource"
      : displayType(resource);
  const showAccess = [
    "student-portal-camu-services",
    "maintenance-service-request",
  ].includes(resource.slug);

  return (
    <>
      <article
        className={classes("resource-row", {
          camu: resource.slug === "student-portal-camu-services",
        })}
      >
        <div className={classes("resource-row-content", {})}>
          <div className={classes("resource-copy", {})}>
            <h3>
              <a href={detailHref(resource)}>
                {home && resource.slug === "student-portal-camu-services"
                  ? "Student Portal / CAMU"
                  : resource.title}
              </a>
            </h3>
            <p>{summary(resource)}</p>
          </div>
          <div className={classes("resource-meta", {})}>
            {resource.slug === "student-portal-camu-services" ? (
              <>
                <a href={detailHref(resource)}>{type}</a>
              </>
            ) : (
              <>
                <span>{type}</span>
              </>
            )}
            {showAccess ? (
              <>
                <span className={classes("meta-dot", {})}>{"·"}</span>
                <span>{resource.access}</span>
              </>
            ) : null}
          </div>
          <a
            href={detailHref(resource)}
            className={classes("details-link", {})}
          >
            {"Details"}
            <span className={classes("sr-only", {})}>
              {" for "}
              {resource.title}
            </span>
          </a>
        </div>
        <a
          href={resource.url}
          target={external(resource.url) ? "_blank" : undefined}
          rel={external(resource.url) ? "noopener noreferrer" : undefined}
          className={classes("action-dock row-action", {})}
        >
          {" Open "}
          <Icon name={"external"} size={16}></Icon>
          <span className={classes("sr-only", {})}>
            {resource.title}
            {external(resource.url) ? " (opens a new tab)" : ""}
          </span>
        </a>
      </article>
    </>
  );
}
