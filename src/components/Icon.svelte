<script>
  export let name = "arrow";
  export let size = 20;
  const paths = {
    arrow: "M4 12h15m-6-6 6 6-6 6",
    external: "M7 17 17 7M7 7h10v10",
    back: "M20 12H5m6-6-6 6 6 6",
    search: "M21 21l-5-5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0",
    resource:
      "M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m2 4h8M8 11h8M8 15h5",
    people:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M13 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    mail: "M3 5h18v14H3zm0 1 9 7 9-7",
    pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    phone:
      "m7 3 3 5-3 3c2 3 3 4 6 6l3-3 5 3c-1 4-3 5-7 3C8 17 4 13 2 7c-1-3 1-4 5-4",
    chevron: "m6 9 6 6 6-6",
    close: "m6 6 12 12M6 18 18 6",
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"><path d={paths[name] || paths.arrow} /></svg
>
