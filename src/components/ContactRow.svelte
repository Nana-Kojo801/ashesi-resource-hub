<script>
  import Icon from "./Icon.svelte";
  import { actionLabel, contactInfo, external } from "../lib/presentation";
  export let resource;
  $: info = contactInfo(resource);
  $: description =
    resource.slug === "academic-registry"
      ? "Registration, records, exams and transcripts."
      : `${info.description}.`;
</script>

<article class="contact-row">
  <div class="contact-content">
    <div class="contact-copy">
      <h2>{resource.title}</h2>
      <p>{description}</p>
    </div>
    <div class="contact-information">
      {#if info.email}<a class="contact-email" href={resource.url}
          ><span class="mobile-mail"><Icon name="mail" size={17} /></span><span
            >{info.email}</span
          ></a
        >{/if}
      {#if info.location}<p>
          <Icon name="pin" size={17} /><span>{info.location}</span>
        </p>{/if}
      {#if info.phone}<a href={`tel:${info.phone.replace(/[^+\d]/g, "")}`}
          ><Icon name="phone" size={17} /><span>{info.phone}</span></a
        >{/if}
    </div>
  </div>
  <a
    class="action-dock contact-action"
    href={resource.url}
    target={external(resource.url) ? "_blank" : undefined}
    rel={external(resource.url) ? "noopener noreferrer" : undefined}
    >{actionLabel(resource.url)}<span class="mobile-only"> office</span>
    <Icon name="external" size={17} /><span class="sr-only">
      {resource.title}</span
    ></a
  >
</article>
