import Link from "next/link";

export default function HomePage() {
  return (
    <div className="section-container section-padding">
      <div className="max-w-3xl mx-auto text-center">
        <p className="eyebrow text-gold mb-6">Demo Build</p>
        <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8">
          Premium Aluminum Railings.
        </h1>
        <p className="font-body text-lg text-stone-600 mb-12 max-w-2xl mx-auto">
          Glass and picket railing systems designed, fabricated, and powder coated in Aldergrove, BC since 2004.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dealers/login" className="btn-gold">
            Dealer Login
          </Link>
          <Link href="/dealers" className="btn-outline-dark">
            Become a Dealer
          </Link>
        </div>
      </div>
    </div>
  );
}
