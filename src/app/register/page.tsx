import { ServerRegistrationForm } from "@/components/registration/server-registration-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="container py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Register MCP Server</h1>
          <p className="mt-2 text-slate-600">Add a new server to the MCP Registry</p>
        </div>

        <ServerRegistrationForm />
      </div>
    </main>
  );
}
