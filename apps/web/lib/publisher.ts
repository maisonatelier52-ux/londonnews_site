export function getPublisherProfile() {
  return {
    name: process.env.NEXT_PUBLIC_PUBLISHER_NAME || "London News",
    editorialEmail: process.env.NEXT_PUBLIC_EDITORIAL_EMAIL || "editorial@londonnews.co.uk",
    membershipsEmail: process.env.NEXT_PUBLIC_MEMBERSHIPS_EMAIL || "memberships@londonnews.co.uk",
    classifiedsEmail: process.env.NEXT_PUBLIC_CLASSIFIEDS_EMAIL || "classifieds@londonnews.co.uk",
    phone: process.env.NEXT_PUBLIC_PUBLISHER_PHONE || "+44 (0)20 7946 0990",
    address: process.env.NEXT_PUBLIC_PUBLISHER_ADDRESS || "Central London, United Kingdom"
  };
}
