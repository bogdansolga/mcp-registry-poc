CREATE SCHEMA "metrics";
--> statement-breakpoint
CREATE SCHEMA "registry";
--> statement-breakpoint
CREATE TYPE "registry"."server_status" AS ENUM('active', 'inactive', 'error');--> statement-breakpoint
CREATE TYPE "registry"."server_type" AS ENUM('official', 'community', 'mock');--> statement-breakpoint
CREATE TABLE "registry"."mcp_servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"server_type" "registry"."server_type" NOT NULL,
	"endpoint_url" varchar(512) NOT NULL,
	"status" "registry"."server_status" DEFAULT 'active' NOT NULL,
	"version" varchar(50),
	"last_health_check" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_servers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "metrics"."server_health_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"response_time_ms" integer,
	"status_code" integer,
	"error_message" text,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registry"."server_metadata" (
	"server_id" integer PRIMARY KEY NOT NULL,
	"author" varchar(255),
	"repository_url" varchar(512),
	"documentation_url" varchar(512),
	"tags" jsonb
);
--> statement-breakpoint
CREATE TABLE "metrics"."tool_invocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"tool_id" integer NOT NULL,
	"invoked_at" timestamp DEFAULT now() NOT NULL,
	"duration_ms" integer,
	"success" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registry"."tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"input_schema" jsonb,
	"category" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metrics"."server_health_metrics" ADD CONSTRAINT "server_health_metrics_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "registry"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry"."server_metadata" ADD CONSTRAINT "server_metadata_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "registry"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics"."tool_invocations" ADD CONSTRAINT "tool_invocations_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "registry"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics"."tool_invocations" ADD CONSTRAINT "tool_invocations_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "registry"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry"."tools" ADD CONSTRAINT "tools_server_id_mcp_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "registry"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;