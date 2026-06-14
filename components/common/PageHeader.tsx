type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <div className="mb-10 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}