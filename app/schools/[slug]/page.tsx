import { notFound } from "next/navigation";
import SchoolProfileClient from "@/app/schools/SchoolProfileClient";
import { getSchoolListingBySlug } from "@/lib/schoolListings";

type SchoolProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SchoolProfilePage({
  params,
}: SchoolProfilePageProps) {
  const { slug } = await params;

  const school = await getSchoolListingBySlug(slug);

  if (!school) {
    notFound();
  }

  return <SchoolProfileClient school={school} />;
}