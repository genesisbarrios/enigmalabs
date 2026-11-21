// Web-development portfolio and pricing, shared by the Tech page and the
// service-area pages (/web-design/*) so prices only live in one place.
// scripts/prerender-service-areas.js has its own short summary of the
// starting prices for the static HTML; update it too when prices change.

export const workProjects = [
  {
    name: "Pretty Kitty Miami Rescue",
    url: "https://prettykittymiamirescue.org",
    image: "/work/prettykittymiami.png",
    alt: "Pretty Kitty Miami Rescue"
  },
  {
    name: "Photographer Portfolio Website",
    url: "https://www.cinemautographer.com/",
    image: "https://dl.dropboxusercontent.com/s/1jm89lj35tqm1qk0hp1yr/maury.gif?rlkey=tlzw5eq3vkz77q3vx5ol3hpt0&st=vhxcy8fv&dl=0",
    alt: "Maury Ramos Peña Portfolio Website"
  },
  {
    name: "Customized Stone",
    url: "https://www.customizedstone.net",
    image: "/work/customizedstone.png",
    alt: "Customized Stone — custom granite, marble, and quartz countertops in Miami"
  },
  {
    name: "Nuralume",
    url: "https://nuralume.xyz",
    image: "https://dl.dropboxusercontent.com/s/11xwqvyuioco1etjdeu27/nuralume.png?rlkey=xuiz2krmjop7kegb099q4jocg&st=xs0f6rkn&dl=0",
    alt: "Nuralume"
  },
  {
    name: "Influanto | Music Marketing Platform",
    url: "https://influanto.com",
    image: "https://dl.dropboxusercontent.com/s/a7lf48b7uht3dnyl59tc1/influantoHomepageLaptop.png?rlkey=pzp4yi2ns6ppjfmwb9m84t4tz&st=gjpea3z3&dl=0",
    alt: "Influanto the all in one music marketing platform"
  }
];

export const pricingCards: { title: string; items: string[] }[] = [
  {
    title: "Pay Up Front - Custom Website",
    items: [
      "$2000: 10 page website: Includes Google Business Setup and 250 Business Cards (logo design included)",
      "$1000: 5 page website: Includes Google Business Setup and 100 Business Cards (logo design included)",
      "$500: 3 page website"
    ]
  },
  {
    title: "Monthly Subscription",
    items: [
      "$200/mo for a 10 Page Website: Includes Google Business Setup, Unlimited Edits, 24/7 Support, Hosting & Built-in CRM, and 250 Business Cards (logo design included)",
      "$100/mo for a 5 Page Website: Includes Google Business Setup, Hosting, General Support & Built-in CRM, and 100 Business Cards (logo design included)"
    ]
  },
  {
    title: "Hosting & Support",
    items: [
      "$15/mo: Hosting, General Support & Built-in CRM to manage your contacts, mailing list & newsletters",
      "$40/mo: Unlimited edits, 24/7 Support & Built-in CRM"
    ]
  },
  {
    title: "Add Ons",
    items: [
      "$500: Headless E-Commerce Store (Shopify/Printify or Stripe/Square Backend)",
      "$1000: E-Commerce Store with Custom Backend",
      "$1000: Custom Blog"
    ]
  }
];

export const infoCardStyle = {
  backgroundColor: "#111",
  border: "1px solid #68FF00",
  borderRadius: "20px",
  boxShadow: "0 0 20px rgba(104, 255, 0, 0.12)",
  padding: "2rem 1.75rem",
  height: "100%"
};
