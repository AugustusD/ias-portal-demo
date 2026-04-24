import Link from "next/link";

const dealerOptions = [
  {
    title: "Overview",
    description: "Learn about becoming an authorized IAS dealer and the benefits of joining our network.",
    href: "/dealers",
  },
  {
    title: "Inquiries",
    description: "Submit a dealer inquiry and start the application process.",
    href: "/dealers/inquiries",
  },
  {
    title: "Support",
    description: "Get help with orders, training, and technical questions.",
    href: "/dealers/support",
  },
  {
    title: "Login",
    description: "Already a dealer? Sign in to access your portal, tools, and resources.",
    href: "/dealers/login",
  },
];

export default function DealersPage() {
  return (
    <div className="section-container section-padding">
      <div className="max-w-4xl mx-auto">
        <p className="eyebrow text-gold mb-4">Dealers</p>
        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
          Build with Innovative.
        </h1>
        <p className="font-body text-lg text-stone-600 mb-16">
          Join 70+ authorized dealers across Canada offering premium aluminum railing systems.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dealerOptions.map((option) => (
            <Link
              key={option.title}
              href={option.href}
              className="block p-8 border border-stone-200 bg-white hover:border-gold transition-colors"
            >
              <h2 className="text-2xl font-heading font-bold mb-3">{option.title}</h2>
              <p className="font-body text-stone-600">{option.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
