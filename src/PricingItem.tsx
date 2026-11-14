import { Link } from "react-router-dom";

// One web-pricing line ("$2000: 10 page website ..."): the whole line links to
// onboarding, with the leading price in green like the Music page links.
const PricingItem = ({ item }: { item: string }) => {
  const price = item.match(/^\$[\d,]+(\/mo)?/)?.[0] ?? "";
  return (
    <li>
      <Link to="/onboard" className="price-link">
        {price && <span className="price">{price}</span>}
        {item.slice(price.length)}
      </Link>
    </li>
  );
};

export default PricingItem;
