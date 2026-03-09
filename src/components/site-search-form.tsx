import { SearchIcon } from '@/components/icons';

interface SiteSearchFormProps {
  action?: string;
  defaultValue?: string;
  hiddenFields?: Record<string, string | undefined>;
  placeholder: string;
}

export function SiteSearchForm({ action = '/souls', defaultValue, hiddenFields, placeholder }: SiteSearchFormProps) {
  return (
    <form action={action} className="search-form" role="search">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) =>
            value ? <input key={name} type="hidden" name={name} value={value} /> : null,
          )
        : null}
      <label className="sr-only" htmlFor="site-search-input">
        搜索灵魂
      </label>
      <SearchIcon className="search-form__icon" />
      <input
        id="site-search-input"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="search-form__input"
      />
      <button type="submit" className="search-form__submit">
        搜索
      </button>
    </form>
  );
}
