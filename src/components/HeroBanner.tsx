import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

type HeroAction = {
  label?: ReactNode;
  to?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  icon?: string;
  iconClassName?: string;
};

type HeroBannerProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  primary?: HeroAction;
  secondary?: HeroAction;
  kicker?: {
    icon?: string;
    value?: ReactNode;
    label?: ReactNode;
  };
  image?: {
    src?: string;
    alt?: string;
  };
};

const DEFAULT_KICKER = {
  icon: "mdi:bell-outline",
  label: "Curated recommendations to accelerate your growth.",
};
const DEFAULT_PRIMARY_ICON = "mdi:search";
const DEFAULT_SECONDARY_ICON = "mdi:office-building-plus-outline";
const DEFAULT_IMAGE = "https://www.22onsloane.co/wp-content/uploads/2025/09/business-people-laptop-or-discussion-in-meeting-i-2025-04-06-10-32-37-utc-scaled.jpg";

function ActionButton({ action, variant }: { action?: HeroAction; variant: "primary" | "secondary" }) {
  if (!action?.label) return null;

  const className =
    variant === "primary"
      ? "btn btn-primary btn-lg text-neutral-600"
      : "btn btn-light btn-lg text-neutral-400 fw-semibold";

  const iconName = action.icon ?? (variant === "primary" ? DEFAULT_PRIMARY_ICON : DEFAULT_SECONDARY_ICON);
  const iconClass = action.iconClassName ? ` ${action.iconClassName}` : "";

  const content = (
    <>
      {iconName && <Icon icon={iconName} className={`me-2${iconClass}`} />}
      {action.label}
    </>
  );

  if (action.to) {
    return (
      <Link to={action.to} className={className} onClick={action.onClick as MouseEventHandler<HTMLAnchorElement>}>
        {content}
      </Link>
    );
  }

  if (action.href) {
    return (
      <a href={action.href} className={className} onClick={action.onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={action.onClick}>
      {content}
    </button>
  );
}

export default function HeroBanner({ title, subtitle, primary, secondary, kicker, image }: HeroBannerProps) {
  const kickerContent = kicker ?? DEFAULT_KICKER;
  const showKicker = kickerContent?.label || kickerContent?.value;
  const heroImageSrc = image?.src || DEFAULT_IMAGE;
  const heroImageAlt = image?.alt || "";
  const hasActions = !!(primary?.label || secondary?.label);

  return (
    <div className="col-12">
      <div className="access-capital__hero card border-0 mb-4 mb-lg-5">
        <div className="card-body p-4 p-lg-5">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              {showKicker && (
                <div className="d-inline-flex align-items-center gap-2 mb-3 small text-white-50">
                  {(kickerContent?.icon || DEFAULT_KICKER.icon) && (
                    <Icon icon={kickerContent?.icon ?? DEFAULT_KICKER.icon} width={18} height={18} />
                  )}
                  <span>
                    {kickerContent?.value && <strong>{kickerContent.value}</strong>}
                    {kickerContent?.value ? " " : null}
                    {kickerContent?.label}
                  </span>
                </div>
              )}

              {title && <h1 className="display-5 fw-bold mb-3 access-capital__hero-title">{title}</h1>}

              {subtitle && <p className="lead text-white-50 mb-4">{subtitle}</p>}

              {hasActions && (
                <div className="d-flex flex-wrap gap-2">
                  <ActionButton action={primary} variant="primary" />
                  <ActionButton action={secondary} variant="secondary" />
                </div>
              )}
            </div>
            <div className="col-lg-5 d-none d-lg-block">
              <div className="access-capital__hero-visual" aria-hidden="true">
                <img
                  src={heroImageSrc}
                  alt={heroImageAlt}
                  loading="lazy"
                  className="img-fluid rounded-4 shadow-lg w-100 h-100 object-fit-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
