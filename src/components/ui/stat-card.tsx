import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  valueClassName?: string;
}

function StatCard({ title, value, description, valueClassName }: StatCardProps) {
  const displayValue = typeof value === "number" ? value.toLocaleString("en-US") : value;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={valueClassName ?? "text-4xl"}>{displayValue}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}

export { StatCard };
export type { StatCardProps };
