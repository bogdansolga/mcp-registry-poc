"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  input_schema: string;
}

interface FormErrors {
  name?: string;
  display_name?: string;
  endpoint_url?: string;
  tools?: { [key: number]: { name?: string; description?: string; input_schema?: string } };
}

const createTool = (): Tool => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  category: "",
  input_schema: "",
});

export function ServerRegistrationForm() {
  const router = useRouter();

  // Basic Information
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [serverType, setServerType] = useState<"official" | "community" | "mock">("community");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [version, setVersion] = useState("");

  // Metadata
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [author, setAuthor] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [tags, setTags] = useState("");

  // Tools
  const [tools, setTools] = useState<Tool[]>([]);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateName = (value: string): string | undefined => {
    if (!value) return "Name is required";
    if (value.length > 100) return "Name must be 100 characters or less";
    if (!/^[a-z0-9-]+$/.test(value)) return "Name must be lowercase alphanumeric with hyphens only";
    return undefined;
  };

  const validateDisplayName = (value: string): string | undefined => {
    if (!value) return "Display name is required";
    if (value.length > 200) return "Display name must be 200 characters or less";
    return undefined;
  };

  const validateUrl = (value: string): string | undefined => {
    if (!value) return "Endpoint URL is required";
    try {
      new URL(value);
      return undefined;
    } catch {
      return "Invalid URL format";
    }
  };

  const validateJson = (value: string): string | undefined => {
    if (!value) return undefined;
    try {
      JSON.parse(value);
      return undefined;
    } catch {
      return "Invalid JSON format";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const displayNameError = validateDisplayName(displayName);
    if (displayNameError) newErrors.display_name = displayNameError;

    const urlError = validateUrl(endpointUrl);
    if (urlError) newErrors.endpoint_url = urlError;

    // Validate tools
    if (tools.length > 0) {
      const toolErrors: { [key: number]: { name?: string; description?: string; input_schema?: string } } = {};
      tools.forEach((tool, index) => {
        const errors: { name?: string; description?: string; input_schema?: string } = {};
        if (!tool.name) errors.name = "Tool name is required";
        if (!tool.description) errors.description = "Tool description is required";
        const schemaError = validateJson(tool.input_schema);
        if (schemaError) errors.input_schema = schemaError;
        if (Object.keys(errors).length > 0) {
          toolErrors[index] = errors;
        }
      });
      if (Object.keys(toolErrors).length > 0) {
        newErrors.tools = toolErrors;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTool = () => {
    setTools([...tools, createTool()]);
  };

  const handleRemoveTool = (index: number) => {
    setTools(tools.filter((_, i) => i !== index));
  };

  const handleToolChange = (index: number, field: keyof Tool, value: string) => {
    const newTools = [...tools];
    newTools[index] = { ...newTools[index], [field]: value };
    setTools(newTools);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build metadata object
      const metadata: {
        author?: string;
        repository_url?: string;
        documentation_url?: string;
        tags?: string[];
      } = {};

      if (author) metadata.author = author;
      if (repositoryUrl) metadata.repository_url = repositoryUrl;
      if (documentationUrl) metadata.documentation_url = documentationUrl;
      if (tags) {
        metadata.tags = tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }

      // Build tools array
      const formattedTools = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        ...(tool.category && { category: tool.category }),
        ...(tool.input_schema && { input_schema: JSON.parse(tool.input_schema) }),
      }));

      // Build request body
      const body: {
        name: string;
        display_name: string;
        server_type: string;
        endpoint_url: string;
        description?: string;
        version?: string;
        metadata?: typeof metadata;
        tools?: typeof formattedTools;
      } = {
        name,
        display_name: displayName,
        server_type: serverType,
        endpoint_url: endpointUrl,
      };

      if (description) body.description = description;
      if (version) body.version = version;
      if (Object.keys(metadata).length > 0) body.metadata = metadata;
      if (formattedTools.length > 0) body.tools = formattedTools;

      const response = await fetch("/api/registry/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa("admin:password")}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("A server with this name already exists");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Registration failed (${response.status})`);
      }

      setSubmitSuccess(true);

      // Redirect to registry after short delay
      setTimeout(() => {
        router.push("/registry");
      }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {submitSuccess && (
        <div className="rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          Server registered successfully! Redirecting to registry...
        </div>
      )}

      {/* Error Message */}
      {submitError && <div className="rounded-md bg-destructive/10 p-4 text-destructive">{submitError}</div>}

      {/* Section 1: Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="my-server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              <p className="text-xs text-muted-foreground">Unique identifier (lowercase, hyphens allowed)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="My Server"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                aria-invalid={!!errors.display_name}
              />
              {errors.display_name && <p className="text-sm text-destructive">{errors.display_name}</p>}
              <p className="text-xs text-muted-foreground">Human-readable name</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this server does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="serverType">Server Type</Label>
              <Select
                id="serverType"
                value={serverType}
                onChange={(e) => setServerType(e.target.value as "official" | "community" | "mock")}
              >
                <option value="official">Official</option>
                <option value="community">Community</option>
                <option value="mock">Mock</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpointUrl">
                Endpoint URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endpointUrl"
                type="url"
                placeholder="http://localhost:8080"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                aria-invalid={!!errors.endpoint_url}
              />
              {errors.endpoint_url && <p className="text-sm text-destructive">{errors.endpoint_url}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" placeholder="1.0.0" value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Metadata (Collapsible) */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setMetadataExpanded(!metadataExpanded)}>
          <CardTitle className="flex items-center justify-between">
            <span>Metadata (Optional)</span>
            <span className="text-sm font-normal text-muted-foreground">{metadataExpanded ? "[-]" : "[+]"}</span>
          </CardTitle>
        </CardHeader>
        {metadataExpanded && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="author">Author Name</Label>
                <Input id="author" placeholder="John Doe" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repositoryUrl">Repository URL</Label>
                <Input
                  id="repositoryUrl"
                  type="url"
                  placeholder="https://github.com/..."
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documentationUrl">Documentation URL</Label>
                <Input
                  id="documentationUrl"
                  type="url"
                  placeholder="https://docs.example.com"
                  value={documentationUrl}
                  onChange={(e) => setDocumentationUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="api, tools, utility"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Comma-separated list</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Section 3: Tools (Dynamic List) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tools</span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddTool}>
              Add Tool
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tools.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No tools added yet. Click &quot;Add Tool&quot; to add one.
            </p>
          ) : (
            tools.map((tool, index) => (
              <Card key={tool.id} className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-medium">Tool {index + 1}</span>
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveTool(index)}>
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`tool-name-${index}`}>
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`tool-name-${index}`}
                        placeholder="tool_name"
                        value={tool.name}
                        onChange={(e) => handleToolChange(index, "name", e.target.value)}
                        aria-invalid={!!errors.tools?.[index]?.name}
                      />
                      {errors.tools?.[index]?.name && (
                        <p className="text-sm text-destructive">{errors.tools[index].name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`tool-category-${index}`}>Category</Label>
                      <Input
                        id={`tool-category-${index}`}
                        placeholder="utility"
                        value={tool.category}
                        onChange={(e) => handleToolChange(index, "category", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`tool-description-${index}`}>
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={`tool-description-${index}`}
                      placeholder="Describe what this tool does..."
                      value={tool.description}
                      onChange={(e) => handleToolChange(index, "description", e.target.value)}
                      rows={2}
                      aria-invalid={!!errors.tools?.[index]?.description}
                    />
                    {errors.tools?.[index]?.description && (
                      <p className="text-sm text-destructive">{errors.tools[index].description}</p>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`tool-schema-${index}`}>Input Schema (JSON)</Label>
                    <Textarea
                      id={`tool-schema-${index}`}
                      placeholder='{"type": "object", "properties": {}}'
                      value={tool.input_schema}
                      onChange={(e) => handleToolChange(index, "input_schema", e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                      aria-invalid={!!errors.tools?.[index]?.input_schema}
                    />
                    {errors.tools?.[index]?.input_schema && (
                      <p className="text-sm text-destructive">{errors.tools[index].input_schema}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/registry")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register Server"}
        </Button>
      </div>
    </form>
  );
}
