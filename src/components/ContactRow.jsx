import { Fragment, useState, useMemo, useEffect } from "react";
import { classes } from "../lib/classes";
import Icon from "./Icon";
import { actionLabel, contactInfo, external } from "../lib/presentation";
export default function ContactRow({ resource }) {
  const info = contactInfo(resource);
  const description =
    resource.slug === "academic-registry"
      ? "Registration, records, exams and transcripts."
      : `${info.description}.`;

  return (
    <>
      <article className={classes("contact-row", {})}>
        <div className={classes("contact-content", {})}>
          <div className={classes("contact-copy", {})}>
            <h2>{resource.title}</h2>
            <p>{description}</p>
          </div>
          <div className={classes("contact-information", {})}>
            {info.email ? (
              <>
                <a href={resource.url} className={classes("contact-email", {})}>
                  <span className={classes("mobile-mail", {})}>
                    <Icon name={"mail"} size={17}></Icon>
                  </span>
                  <span>{info.email}</span>
                </a>
              </>
            ) : null}
            {info.location ? (
              <>
                <p>
                  <Icon name={"pin"} size={17}></Icon>
                  <span>{info.location}</span>
                </p>
              </>
            ) : null}
            {info.phone ? (
              <>
                <a href={`tel:${info.phone.replace(/[^+\d]/g, "")}`}>
                  <Icon name={"phone"} size={17}></Icon>
                  <span>{info.phone}</span>
                </a>
              </>
            ) : null}
          </div>
        </div>
        <a
          href={resource.url}
          target={external(resource.url) ? "_blank" : undefined}
          rel={external(resource.url) ? "noopener noreferrer" : undefined}
          className={classes("action-dock contact-action", {})}
        >
          {actionLabel(resource.url)}
          <span className={classes("mobile-only", {})}>{" office"}</span>
          <Icon name={"external"} size={17}></Icon>
          <span className={classes("sr-only", {})}>{resource.title}</span>
        </a>
      </article>
    </>
  );
}
