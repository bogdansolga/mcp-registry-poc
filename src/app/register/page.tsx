import { ServerRegistrationForm } from "@/components/registration/server-registration-form";

export default function RegisterPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Register MCP Server</h1>
        <p className="mt-2 text-muted-foreground">Add a new server to the MCP Registry</p>
      </div>

      <ServerRegistrationForm />
    </main>
  );
}
