import { Button } from "@/components/ui/button";

export default function HeroV2() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
            Discover. Compare. Decide.
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Helping Parents Make the Right School Choice.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Search UAE schools, compare fees and ratings, or let HeecoWorld
            recommend the best options for your child.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg">Start School Match</Button>
            <Button size="lg" variant="outline">
              Browse Schools
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50">
          <div className="rounded-2xl bg-blue-50 p-6">
            <p className="text-sm font-semibold text-blue-700">
              School Match Preview
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                British Curriculum • Dubai • AED 30k–50k
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                CBSE • Sharjah • Transport Available
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                Top matches based on your preferences
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}