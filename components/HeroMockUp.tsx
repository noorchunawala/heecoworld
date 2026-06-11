"use client";

export default function HeroMockup() {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border max-w-lg">

      <div className="mb-8">
        <p className="text-blue-600 font-semibold text-sm">
          THE HEECO JOURNEY
        </p>

        <h3 className="text-3xl font-bold mt-2">
          From Classroom to Career Awareness
        </h3>
      </div>

      <div className="space-y-4">

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border">
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            1
          </div>

          <div>
            <h4 className="font-semibold">
              Submit Enquiry
            </h4>

            <p className="text-sm text-slate-500">
              Institution shares requirements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border">
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            2
          </div>

          <div>
            <h4 className="font-semibold">
              Receive Proposal
            </h4>

            <p className="text-sm text-slate-500">
              Structured visit planning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border">
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            3
          </div>

          <div>
            <h4 className="font-semibold">
              Industry Exposure
            </h4>

            <p className="text-sm text-slate-500">
              Students experience real workplaces
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border">
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            4
          </div>

          <div>
            <h4 className="font-semibold">
              Career Awareness
            </h4>

            <p className="text-sm text-slate-500">
              Better understanding of future opportunities
            </p>
          </div>
        </div>

      </div>

      <div className="mt-8 flex flex-wrap gap-3">

        <span className="px-4 py-2 bg-blue-50 rounded-full text-sm">
          Aviation
        </span>

        <span className="px-4 py-2 bg-blue-50 rounded-full text-sm">
          Technology
        </span>

        <span className="px-4 py-2 bg-blue-50 rounded-full text-sm">
          Healthcare
        </span>

        <span className="px-4 py-2 bg-blue-50 rounded-full text-sm">
          Logistics
        </span>

        <span className="px-4 py-2 bg-blue-50 rounded-full text-sm">
          Manufacturing
        </span>

      </div>

    </div>
  );
}