import Icon from "./Icon";

export default function SearchBox({
  query = "",
  placeholder = "Describe what you need…",
  showIcon = false,
  onQuery,
}) {
  const update = (value) => onQuery({ detail: value });
  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        update(query);
      }}
    >
      {showIcon && (
        <span className="search-icon">
          <Icon name="search" size={23} />
        </span>
      )}
      <input
        id="resource-search"
        type="search"
        value={query}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder.replace("…", "")}
        autoComplete="off"
      />
      {query && (
        <button
          className="clear-search"
          type="button"
          aria-label="Clear search"
          onClick={() => {
            update("");
            document.getElementById("resource-search")?.focus();
          }}
        >
          <Icon name="close" size={18} />
        </button>
      )}
      <button className="search-submit" type="submit" aria-label="Search">
        <Icon name="arrow" size={26} />
      </button>
    </form>
  );
}
